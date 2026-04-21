import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { v4 } from "uuid"
import { ConnectRepository } from "@/common/entities/connect-repository"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import { Agent } from "../agent.entity"
import type { BaseAgentSessionType } from "../base-agent-sessions/base-agent-sessions.types"
import { AgentMessage } from "../shared/agent-session-messages/agent-message.entity"
import { FormAgentSession } from "./form-agent-session.entity"

@Injectable()
export class FormAgentSessionsService {
  private readonly sessionConnectRepository: ConnectRepository<FormAgentSession>
  private readonly agentMessageConnectRepository: ConnectRepository<AgentMessage>
  private readonly agentConnectRepository: ConnectRepository<Agent>

  constructor(
    @InjectRepository(FormAgentSession)
    formAgentSessionRepository: Repository<FormAgentSession>,

    @InjectRepository(AgentMessage)
    agentMessageRepository: Repository<AgentMessage>,

    @InjectRepository(Agent)
    agentRepository: Repository<Agent>,
  ) {
    this.sessionConnectRepository = new ConnectRepository(
      formAgentSessionRepository,
      "formAgentSession",
    )
    this.agentMessageConnectRepository = new ConnectRepository(
      agentMessageRepository,
      "agentMessage",
    )
    this.agentConnectRepository = new ConnectRepository(agentRepository, "agents")
  }

  async listSessions({
    connectScope,
    agentId,
    userId,
    type,
  }: {
    userId: string
    connectScope: RequiredConnectScope
    agentId: string
    type: BaseAgentSessionType
  }): Promise<FormAgentSession[]> {
    return this.sessionConnectRepository.find(connectScope, {
      where: { agentId, type, userId },
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
    const agent = await this.agentConnectRepository.getOneById(connectScope, agentId)
    if (!agent) throw new NotFoundException(`Agent with id ${agentId} not found`)

    const session = await this.sessionConnectRepository.createAndSave(connectScope, {
      agentId,
      userId,
      type,
      traceId: v4(),
    })

    const greetingMessage = agent.greetingMessage
    if (greetingMessage && greetingMessage.trim().length > 0) {
      const now = new Date()
      await this.agentMessageConnectRepository.createAndSave(connectScope, {
        sessionId: session.id,
        role: "assistant",
        content: greetingMessage,
        status: "completed",
        startedAt: now,
        completedAt: now,
      })
    }

    return session
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

  async updateSessionResult({
    connectScope,
    input,
    sessionId,
  }: {
    connectScope: RequiredConnectScope
    input: Record<string, unknown>
    sessionId: string
  }): Promise<{ result: Record<string, unknown> | null }> {
    const session = await this.sessionConnectRepository.getOneById(connectScope, sessionId)
    if (!session) return { result: null }

    session.result = { ...session.result, ...input } // mergedResult

    const updatedSession = await this.sessionConnectRepository.saveOne(session)

    return { result: updatedSession.result }
  }
}
