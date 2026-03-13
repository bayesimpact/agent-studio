import { Inject, Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { ToolSet } from "ai"
import type { Repository } from "typeorm"
import { v4 } from "uuid"
import { ConnectRepository } from "@/common/entities/connect-repository"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import type { LLMProvider } from "@/common/interfaces/llm-provider.interface"
import type { Agent } from "@/domains/agents/agent.entity"
import { FILE_STORAGE_SERVICE } from "@/domains/documents/storage/file-storage.interface"
import { ServiceWithLLM } from "@/external/llm"
import type { BaseAgentSessionType } from "../base-agent-sessions/base-agent-sessions.types"
import { fillFormTool } from "../shared/agent-session-messages/streaming/tools/fill-form.tool"
import type { ToolExecutionLog } from "../shared/agent-session-messages/streaming/tools/tool-execution-log"
import { FormAgentSession } from "./form-agent-session.entity"

@Injectable()
export class FormAgentSessionsService extends ServiceWithLLM {
  private readonly sessionConnectRepository: ConnectRepository<FormAgentSession>
  private readonly formAgentSessionRepository: Repository<FormAgentSession>
  constructor(
    @InjectRepository(FormAgentSession)
    formAgentSessionRepository: Repository<FormAgentSession>,
    @Inject(FILE_STORAGE_SERVICE)
    @Inject("_MockLLMProvider")
    mockLlmProvider: LLMProvider,
    @Inject("VertexLLMProvider")
    vertexLlmProvider: LLMProvider,
  ) {
    super(mockLlmProvider, vertexLlmProvider)
    this.formAgentSessionRepository = formAgentSessionRepository
    this.sessionConnectRepository = new ConnectRepository(
      formAgentSessionRepository,
      "formAgentSession",
    )
  }

  async listSessions({
    connectScope,
    agentId,
    type,
  }: {
    connectScope: RequiredConnectScope
    agentId: string
    type: BaseAgentSessionType
  }): Promise<FormAgentSession[]> {
    return this.sessionConnectRepository.find(connectScope, {
      where: { agentId, type },
      order: { createdAt: "DESC" },
    })
  }

  async createSession({
    connectScope,
    agentId,
    userId,
    type,
  }: {
    connectScope: RequiredConnectScope
    userId: string
    agentId: string
    type: BaseAgentSessionType
  }): Promise<FormAgentSession> {
    return await this.sessionConnectRepository.createAndSave(connectScope, {
      agentId,
      userId,
      type,
      traceId: v4(),
    })
  }

  async findSessionById({
    connectScope,
    sessionId,
    agentId,
    type,
  }: {
    connectScope: RequiredConnectScope
    sessionId: string
    agentId: string
    type: BaseAgentSessionType
  }): Promise<FormAgentSession | null> {
    const sessions = await this.sessionConnectRepository.find(connectScope, {
      where: { id: sessionId, agentId, type },
      take: 1,
    })
    const session = sessions[0]
    if (!session) return null
    return session
  }

  buildFillFormTool({
    agent,
    sessionId,
    onExecute,
  }: {
    agent: Agent
    sessionId: string
    onExecute: (toolExecution: ToolExecutionLog) => void
  }): ToolSet {
    const handleExecute = async (input: Record<string, unknown>) => {
      // TODO: merge value and existing result instead of replacing it
      const session = await this.formAgentSessionRepository.findOneBy({ id: sessionId })
      if (!session) return
      const mergedResult = { ...session.result, ...input }
      const updated = await this.formAgentSessionRepository.update(sessionId, {
        // @ts-expect-error // FIXME:
        result: mergedResult,
      })
      if (!updated.affected) return

      onExecute({
        toolName: "fillForm",
        arguments: input,
      })
    }
    return { fillForm: fillFormTool({ agent, onExecute: handleExecute }) } as ToolSet
  }
}
