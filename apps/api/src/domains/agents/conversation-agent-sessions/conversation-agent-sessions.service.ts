import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { v4 } from "uuid"

import { ConnectRepository } from "@/common/entities/connect-repository"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import type { BaseAgentSessionType } from "../base-agent-sessions/base-agent-sessions.types"
import { AgentMessage } from "../shared/agent-session-messages/agent-message.entity"
import { ConversationAgentSession } from "./conversation-agent-session.entity"

@Injectable()
export class ConversationAgentSessionsService {
  private readonly conversationAgentSessionConnectRepository: ConnectRepository<ConversationAgentSession>
  private readonly agentMessageConnectRepository: ConnectRepository<AgentMessage>

  constructor(
    @InjectRepository(ConversationAgentSession)
    conversationAgentSessionRepository: Repository<ConversationAgentSession>,

    @InjectRepository(AgentMessage)
    agentMessageRepository: Repository<AgentMessage>,
  ) {
    this.conversationAgentSessionConnectRepository = new ConnectRepository(
      conversationAgentSessionRepository,
      "conversationAgentSession",
    )
    this.agentMessageConnectRepository = new ConnectRepository(
      agentMessageRepository,
      "agentMessage",
    )
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
    return await this.conversationAgentSessionConnectRepository.createAndSave(connectScope, {
      agentId,
      userId,
      type,
      expiresAt: null,
      traceId: v4(),
    })
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
