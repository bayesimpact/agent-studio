import type { Repository } from "typeorm"
import type { LangfuseAdminService } from "@/external/langfuse/langfuse-admin"
import type { ConversationAgentSession } from "../conversation-agent-session.entity"
import type { ConversationAgentSessionPurgeService } from "./conversation-agent-session-purge.service"
import { ConversationRetentionSweepService } from "./conversation-retention-sweep.service"

function buildService(...batches: Partial<ConversationAgentSession>[][]) {
  return buildServiceWithPublicBatches({ batches, publicBatches: [] })
}

function buildServiceWithPublicBatches({
  batches,
  publicBatches,
}: {
  batches: Partial<ConversationAgentSession>[][]
  publicBatches: { id: string }[][]
}) {
  const getMany = jest.fn().mockResolvedValue([])
  for (const batch of batches) getMany.mockResolvedValueOnce(batch)
  const queryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getMany,
  }
  const getRawMany = jest.fn().mockResolvedValue([])
  for (const batch of publicBatches) getRawMany.mockResolvedValueOnce(batch)
  const rawQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawMany,
  }
  const sessionRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    manager: { createQueryBuilder: jest.fn().mockReturnValue(rawQueryBuilder) },
  } as unknown as Repository<ConversationAgentSession>
  const purgeService = {
    purgeSessionContent: jest.fn().mockResolvedValue({ purged: true }),
    purgePublicSessionContent: jest.fn().mockResolvedValue({ purged: true }),
  }
  const langfuseAdminService = {
    deleteTrace: jest.fn().mockResolvedValue(true),
  }
  const service = new ConversationRetentionSweepService(
    sessionRepository,
    purgeService as unknown as ConversationAgentSessionPurgeService,
    langfuseAdminService as unknown as LangfuseAdminService,
  )
  return { service, purgeService, langfuseAdminService, queryBuilder, rawQueryBuilder }
}

describe("ConversationRetentionSweepService", () => {
  it("purges every expired session and deletes its Langfuse trace first", async () => {
    const { service, purgeService, langfuseAdminService } = buildService([
      { id: "session-1", traceId: "trace-1" },
      { id: "session-2", traceId: null as unknown as string },
    ])

    const { purgedCount } = await service.sweepExpiredConversations()

    expect(purgedCount).toBe(2)
    expect(purgeService.purgeSessionContent).toHaveBeenCalledTimes(2)
    expect(langfuseAdminService.deleteTrace).toHaveBeenCalledTimes(1)
    expect(langfuseAdminService.deleteTrace).toHaveBeenCalledWith("trace-1")
    // the trace deletion happens before the content purge
    expect(langfuseAdminService.deleteTrace.mock.invocationCallOrder[0]).toBeLessThan(
      purgeService.purgeSessionContent.mock.invocationCallOrder[0] as number,
    )
  })

  it("does not count sessions the purge skipped", async () => {
    const { service, purgeService, langfuseAdminService } = buildService([
      { id: "session-1", traceId: "trace-1" },
    ])
    purgeService.purgeSessionContent.mockResolvedValue({ purged: false })

    const { purgedCount } = await service.sweepExpiredConversations()

    expect(purgedCount).toBe(0)
    expect(langfuseAdminService.deleteTrace).toHaveBeenCalledTimes(1)
  })

  it("postpones the purge when the trace deletion fails, so the next run retries", async () => {
    const { service, purgeService, langfuseAdminService, rawQueryBuilder } = buildService([
      { id: "session-1", traceId: "trace-1" },
      { id: "session-2", traceId: "trace-2" },
    ])
    langfuseAdminService.deleteTrace.mockRejectedValueOnce(new Error("boom"))

    const { purgedCount } = await service.sweepExpiredConversations()

    expect(purgedCount).toBe(1)
    expect(purgeService.purgeSessionContent).toHaveBeenCalledTimes(1)
    expect(purgeService.purgeSessionContent).toHaveBeenCalledWith("session-2")
    // the failed session is excluded from the later queries of the same run
    // (here the public pass, which runs after the conversation pass)
    expect(rawQueryBuilder.andWhere).toHaveBeenCalledWith(
      "session.id NOT IN (:...excludedSessionIds)",
      { excludedSessionIds: ["session-1"] },
    )
  })

  it("excludes an in-run failure from the next conversation batch", async () => {
    const fullBatch = Array.from({ length: 200 }, (_, index) => ({
      id: `session-${index}`,
      traceId: `trace-${index}`,
    }))
    const { service, langfuseAdminService, queryBuilder } = buildService(fullBatch, [])
    langfuseAdminService.deleteTrace.mockRejectedValueOnce(new Error("boom"))

    await service.sweepExpiredConversations()

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "session.id NOT IN (:...excludedSessionIds)",
      { excludedSessionIds: ["session-0"] },
    )
  })

  it("drains full batches until the backlog is empty", async () => {
    const fullBatch = Array.from({ length: 200 }, (_, index) => ({
      id: `session-${index}`,
      traceId: null as unknown as string,
    }))
    const lastBatch = [{ id: "session-last", traceId: null as unknown as string }]
    const { service, purgeService } = buildService(fullBatch, lastBatch)

    const { purgedCount } = await service.sweepExpiredConversations()

    expect(purgedCount).toBe(201)
    expect(purgeService.purgeSessionContent).toHaveBeenCalledTimes(201)
  })

  it("purges expired public sessions and deletes their trace by session id, trace first", async () => {
    const { service, purgeService, langfuseAdminService } = buildServiceWithPublicBatches({
      batches: [],
      publicBatches: [[{ id: "public-1" }, { id: "public-2" }]],
    })

    const { purgedCount } = await service.sweepExpiredConversations()

    expect(purgedCount).toBe(2)
    expect(purgeService.purgePublicSessionContent).toHaveBeenCalledTimes(2)
    expect(langfuseAdminService.deleteTrace).toHaveBeenCalledWith("public-1")
    expect(langfuseAdminService.deleteTrace).toHaveBeenCalledWith("public-2")
    expect(langfuseAdminService.deleteTrace.mock.invocationCallOrder[0]).toBeLessThan(
      purgeService.purgePublicSessionContent.mock.invocationCallOrder[0] as number,
    )
  })

  it("postpones a public session whose trace deletion fails", async () => {
    const { service, purgeService, langfuseAdminService } = buildServiceWithPublicBatches({
      batches: [],
      publicBatches: [[{ id: "public-1" }, { id: "public-2" }]],
    })
    langfuseAdminService.deleteTrace.mockRejectedValueOnce(new Error("boom"))

    const { purgedCount } = await service.sweepExpiredConversations()

    expect(purgedCount).toBe(1)
    expect(purgeService.purgePublicSessionContent).toHaveBeenCalledTimes(1)
    expect(purgeService.purgePublicSessionContent).toHaveBeenCalledWith("public-2")
  })

  it("counts internal and public sessions together", async () => {
    const { service, langfuseAdminService } = buildServiceWithPublicBatches({
      batches: [[{ id: "session-1", traceId: "trace-1" }]],
      publicBatches: [[{ id: "public-1" }]],
    })

    const { purgedCount } = await service.sweepExpiredConversations()

    expect(purgedCount).toBe(2)
    expect(langfuseAdminService.deleteTrace).toHaveBeenCalledTimes(2)
  })
})
