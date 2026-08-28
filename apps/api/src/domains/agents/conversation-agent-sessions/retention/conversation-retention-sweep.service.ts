import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { metrics } from "@opentelemetry/api"
import type { Repository } from "typeorm"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { LangfuseAdminService } from "@/external/langfuse/langfuse-admin"
import { ConversationAgentSession } from "../conversation-agent-session.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ConversationAgentSessionPurgeService } from "./conversation-agent-session-purge.service"
import {
  CONVERSATION_RETENTION_SWEEP_BATCH_LIMIT,
  CONVERSATION_RETENTION_SWEEP_MAX_BATCHES_PER_RUN,
} from "./conversation-retention.constants"

type SweepRunStatus = "OK" | "PARTIAL" | "ERROR"

@Injectable()
export class ConversationRetentionSweepService {
  private readonly logger = new Logger(ConversationRetentionSweepService.name)

  private readonly meter = metrics.getMeter("retention-sweep")
  private readonly runsCounter = this.meter.createCounter("retention.sweep.runs", {
    description: "Retention sweep runs, by worst status (OK | PARTIAL | ERROR)",
  })
  private readonly purgedSessionsCounter = this.meter.createCounter(
    "retention.sweep.purged_sessions",
    { description: "Sessions whose content the retention sweep purged" },
  )
  private readonly durationHistogram = this.meter.createHistogram("retention.sweep.duration", {
    description: "Duration of a retention sweep run",
    unit: "ms",
  })

  constructor(
    @InjectRepository(ConversationAgentSession)
    private readonly sessionRepository: Repository<ConversationAgentSession>,
    private readonly purgeService: ConversationAgentSessionPurgeService,
    private readonly langfuseAdminService: LangfuseAdminService,
  ) {}

  async sweepExpiredConversations(): Promise<{ purgedCount: number }> {
    const startedAt = Date.now()
    // Sessions whose Langfuse trace deletion failed in this run. They keep
    // purged_at empty, so the next nightly run selects and retries them; the
    // in-run exclusion only stops them from filling every batch of THIS run.
    const failedSessionIds = new Set<string>()
    let purgedCount = 0

    try {
      for (let batch = 0; batch < CONVERSATION_RETENTION_SWEEP_MAX_BATCHES_PER_RUN; batch++) {
        const expiredSessions = await this.findExpiredSessionsBatch(failedSessionIds)
        if (expiredSessions.length === 0) break
        purgedCount += await this.purgeBatch(expiredSessions, failedSessionIds)
        if (expiredSessions.length < CONVERSATION_RETENTION_SWEEP_BATCH_LIMIT) break
      }

      purgedCount += await this.sweepExpiredPublicSessions(failedSessionIds)
    } catch (error) {
      this.recordRunMetrics("ERROR", purgedCount, startedAt)
      throw error
    }

    this.recordRunMetrics(failedSessionIds.size > 0 ? "PARTIAL" : "OK", purgedCount, startedAt)
    if (purgedCount > 0 || failedSessionIds.size > 0) {
      this.logger.log(
        `Retention sweep purged ${purgedCount} conversation session(s), ` +
          `${failedSessionIds.size} postponed after a failed trace deletion.`,
      )
    }
    return { purgedCount }
  }

  /** Embed (public) sessions follow the same per-project retention rule. */
  private async sweepExpiredPublicSessions(failedSessionIds: Set<string>): Promise<number> {
    let purgedCount = 0
    for (let batch = 0; batch < CONVERSATION_RETENTION_SWEEP_MAX_BATCHES_PER_RUN; batch++) {
      const expiredSessions = await this.findExpiredPublicSessionsBatch(failedSessionIds)
      if (expiredSessions.length === 0) break
      purgedCount += await this.purgePublicBatch(expiredSessions, failedSessionIds)
      if (expiredSessions.length < CONVERSATION_RETENTION_SWEEP_BATCH_LIMIT) break
    }
    return purgedCount
  }

  private async findExpiredSessionsBatch(
    excludedSessionIds: Set<string>,
  ): Promise<ConversationAgentSession[]> {
    const query = this.sessionRepository
      .createQueryBuilder("session")
      // Joined by table name: importing the Project entity here would be a
      // cross-domain entity import (no-cross-domain-entity-import).
      .innerJoin("project", "project", "project.id = session.project_id")
      .where("project.conversation_retention_days IS NOT NULL")
      .andWhere("session.purged_at IS NULL")
      .andWhere(
        "session.created_at < now() - (project.conversation_retention_days * interval '1 day')",
      )
    if (excludedSessionIds.size > 0) {
      query.andWhere("session.id NOT IN (:...excludedSessionIds)", {
        excludedSessionIds: [...excludedSessionIds],
      })
    }
    return query
      .orderBy("session.created_at", "ASC")
      .limit(CONVERSATION_RETENTION_SWEEP_BATCH_LIMIT)
      .getMany()
  }

  // Queried by table name: importing the PublicAgentSession entity here would
  // be a cross-domain entity import (no-cross-domain-entity-import). A raw
  // FROM also skips the soft-delete filter, hence the deleted_at clause.
  private async findExpiredPublicSessionsBatch(
    excludedSessionIds: Set<string>,
  ): Promise<{ id: string }[]> {
    const query = this.sessionRepository.manager
      .createQueryBuilder()
      .select("session.id", "id")
      .from("public_agent_session", "session")
      .innerJoin("project", "project", "project.id = session.project_id")
      .where("project.conversation_retention_days IS NOT NULL")
      .andWhere("session.purged_at IS NULL")
      .andWhere("session.deleted_at IS NULL")
      .andWhere(
        "session.created_at < now() - (project.conversation_retention_days * interval '1 day')",
      )
    if (excludedSessionIds.size > 0) {
      query.andWhere("session.id NOT IN (:...excludedSessionIds)", {
        excludedSessionIds: [...excludedSessionIds],
      })
    }
    return query
      .orderBy("session.created_at", "ASC")
      .limit(CONVERSATION_RETENTION_SWEEP_BATCH_LIMIT)
      .getRawMany()
  }

  private async purgeBatch(
    expiredSessions: ConversationAgentSession[],
    failedSessionIds: Set<string>,
  ): Promise<number> {
    let purgedCount = 0
    for (const session of expiredSessions) {
      if (!(await this.deleteTraceBeforePurge(session.id, session.traceId, failedSessionIds))) {
        continue
      }
      const { purged } = await this.purgeService.purgeSessionContent(session.id)
      if (purged) purgedCount += 1
    }

    return purgedCount
  }

  private async purgePublicBatch(
    expiredSessions: { id: string }[],
    failedSessionIds: Set<string>,
  ): Promise<number> {
    let purgedCount = 0
    for (const session of expiredSessions) {
      // Public streaming uses the session id as the Langfuse trace id.
      if (!(await this.deleteTraceBeforePurge(session.id, session.id, failedSessionIds))) {
        continue
      }
      const { purged } = await this.purgeService.purgePublicSessionContent(session.id)
      if (purged) purgedCount += 1
    }

    return purgedCount
  }

  /**
   * The trace goes first: purged_at is set only after every step worked, so a
   * session whose trace deletion failed stays selectable and the next nightly
   * run retries it. Trace deletion tolerates a 404, which makes that safe.
   * Returns false when the purge must be postponed.
   */
  private async deleteTraceBeforePurge(
    sessionId: string,
    traceId: string | null,
    failedSessionIds: Set<string>,
  ): Promise<boolean> {
    if (!traceId) return true
    try {
      await this.langfuseAdminService.deleteTrace(traceId)
      return true
    } catch (error) {
      failedSessionIds.add(sessionId)
      this.logger.error(
        `Langfuse trace deletion failed for session ${sessionId} (trace ${traceId}); ` +
          `purge postponed to the next run: ${(error as Error).message}`,
      )
      return false
    }
  }

  private recordRunMetrics(status: SweepRunStatus, purgedCount: number, startedAt: number): void {
    this.runsCounter.add(1, { status })
    if (purgedCount > 0) this.purgedSessionsCounter.add(purgedCount)
    this.durationHistogram.record(Date.now() - startedAt)
  }
}
