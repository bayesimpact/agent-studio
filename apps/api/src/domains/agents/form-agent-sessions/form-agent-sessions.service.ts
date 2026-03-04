import { Inject, Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { v4 } from "uuid"
import { ConnectRepository } from "@/common/entities/connect-repository"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import type { LLMProvider } from "@/common/interfaces/llm-provider.interface"
import { FILE_STORAGE_SERVICE } from "@/domains/documents/storage/file-storage.interface"
import { ServiceWithLLM } from "@/external/llm"
import type { BaseAgentSessionType } from "../base-agent-sessions/base-agent-sessions.types"
import { FormAgentSession } from "./form-agent-session.entity"

@Injectable()
export class FormAgentSessionsService extends ServiceWithLLM {
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
    this.sessionConnectRepository = new ConnectRepository(
      formAgentSessionRepository,
      "formAgentSession",
    )
  }

  private readonly sessionConnectRepository: ConnectRepository<FormAgentSession>

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
    type,
  }: {
    connectScope: RequiredConnectScope
    agentId: string
    type: BaseAgentSessionType
  }): Promise<FormAgentSession> {
    return await this.sessionConnectRepository.createAndSave(connectScope, {
      agentId,
      userId: connectScope.userId,
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
}
