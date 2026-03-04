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
  constructor(
    @InjectRepository(ConversationAgentSession)
    conversationAgentSessionRepository: Repository<ConversationAgentSession>,

    @InjectRepository(AgentMessage)
    agentMessageRepository: Repository<AgentMessage>,
  ) {
    this.conversationAgentSessionRepository = conversationAgentSessionRepository
    this.conversationAgentSessionConnectRepository = new ConnectRepository(
      conversationAgentSessionRepository,
      "conversationAgentSession",
    )

    this.agentMessageRepository = agentMessageRepository
  }

  private readonly conversationAgentSessionRepository: Repository<ConversationAgentSession>
  private readonly conversationAgentSessionConnectRepository: ConnectRepository<ConversationAgentSession>

  private readonly agentMessageRepository: Repository<AgentMessage>

  async listMessagesForSession(agentSessionId: string): Promise<AgentMessage[]> {
    return this.agentMessageRepository.find({
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

  /**
   * Deletes all playground sessions for a agent
   * Called when agent configuration changes
   */
  async deletePlaygroundSessionsForAgent(agentId: string): Promise<void> {
    await this.conversationAgentSessionRepository.delete({
      agentId,
      type: "playground",
    })
  }

  /**
   * Deletes all sessions for a agent
   * Called when deleting a agent
   */
  async deleteAllSessionsForAgent(agentId: string): Promise<void> {
    await this.conversationAgentSessionRepository.delete({
      agentId,
    })
  }

  /**
   * Deletes expired playground sessions
   * Called by cleanup cron job
   * Uses 5-minute safety margin to avoid deleting active streams
   */
  async deleteExpiredPlaygroundSessions(): Promise<number> {
    const fiveMinutesAgo = new Date()
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5)

    const result = await this.conversationAgentSessionRepository
      .createQueryBuilder()
      .delete()
      .from(ConversationAgentSession)
      .where("type = :type", { type: "playground" })
      .andWhere("expires_at < :cutoff", { cutoff: fiveMinutesAgo })
      .execute()

    return result.affected || 0
  }
}
