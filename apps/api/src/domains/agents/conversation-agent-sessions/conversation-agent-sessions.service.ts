import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { v4 } from "uuid"

import { ConnectRepository } from "@/common/entities/connect-repository"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import { Agent } from "../agent.entity"
import type { BaseAgentSessionType } from "../base-agent-sessions/base-agent-sessions.types"
import { AgentMessage } from "../shared/agent-session-messages/agent-message.entity"
import { ConversationAgentSession } from "./conversation-agent-session.entity"

@Injectable()
export class ConversationAgentSessionsService {
  private readonly conversationAgentSessionConnectRepository: ConnectRepository<ConversationAgentSession>
  private readonly agentMessageConnectRepository: ConnectRepository<AgentMessage>
  private readonly agentConnectRepository: ConnectRepository<Agent>

  constructor(
    @InjectRepository(ConversationAgentSession)
    conversationAgentSessionRepository: Repository<ConversationAgentSession>,

    @InjectRepository(AgentMessage)
    agentMessageRepository: Repository<AgentMessage>,

    @InjectRepository(Agent)
    agentRepository: Repository<Agent>,
  ) {
    this.conversationAgentSessionConnectRepository = new ConnectRepository(
      conversationAgentSessionRepository,
      "conversationAgentSession",
    )
    this.agentMessageConnectRepository = new ConnectRepository(
      agentMessageRepository,
      "agentMessage",
    )
    this.agentConnectRepository = new ConnectRepository(agentRepository, "agents")
  }

  async listMessagesForSession({
    agentSessionId,
    connectScope,
  }: {
    agentSessionId: string
    connectScope: RequiredConnectScope
  }): Promise<AgentMessage[]> {
    return this.agentMessageConnectRepository.find(connectScope, {
      where: { sessionId: agentSessionId },
      order: { createdAt: "ASC" },
    })
  }

  async getAllSessionsForAgent({
    connectScope,
    agentId,
    userId,
    type,
  }: {
    connectScope: RequiredConnectScope
    agentId: string
    userId: string
    type: BaseAgentSessionType
  }): Promise<ConversationAgentSession[]> {
    return await this.conversationAgentSessionConnectRepository.find(connectScope, {
      where: { agentId, userId, type },
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
    agentId: string
    userId: string
    type: BaseAgentSessionType
  }): Promise<ConversationAgentSession> {
    const agent = await this.agentConnectRepository.getOneById(connectScope, agentId)
    if (!agent) throw new NotFoundException(`Agent with id ${agentId} not found`)

    const session = await this.conversationAgentSessionConnectRepository.createAndSave(
      connectScope,
      {
        agentId,
        userId,
        type,
        expiresAt: null,
        traceId: v4(),
      },
    )

    const defaultFirstMessage = agent.defaultFirstMessage
    if (defaultFirstMessage && defaultFirstMessage.trim().length > 0) {
      const now = new Date()
      await this.agentMessageConnectRepository.createAndSave(connectScope, {
        sessionId: session.id,
        role: "assistant",
        content: defaultFirstMessage,
        status: "completed",
        startedAt: now,
        completedAt: now,
      })
    }

    return session
  }

  async findById({
    id,
    connectScope,
  }: {
    id: string
    connectScope: RequiredConnectScope
  }): Promise<ConversationAgentSession | null> {
    return await this.conversationAgentSessionConnectRepository.getOneById(connectScope, id)
  }
}
