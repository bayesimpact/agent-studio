import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { v4 } from "uuid"

import { ConnectRepository } from "@/common/entities/connect-repository"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import type { BaseAgentSessionType } from "../base-agent-sessions/base-agent-sessions.types"
import { ConversationAgentSession } from "./conversation-agent-session.entity"
import { AgentMessage } from "./messages/agent-message.entity"

@Injectable()
export class ConversationAgentSessionsService {
  private readonly STREAM_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

  constructor(
    @InjectRepository(ConversationAgentSession)
    conversationAgentSessionRepository: Repository<ConversationAgentSession>,
    @InjectRepository(AgentMessage)
    agentMessageRepository: Repository<AgentMessage>,
  ) {
    this.conversationAgentSessionRepository = conversationAgentSessionRepository
    this.agentMessageRepository = agentMessageRepository
    this.conversationAgentSessionConnectRepository = new ConnectRepository(
      conversationAgentSessionRepository,
      "conversationAgentSession",
    )
    this.agentMessageConnectRepository = new ConnectRepository(
      agentMessageRepository,
      "agentMessage",
    )
  }

  private readonly conversationAgentSessionRepository: Repository<ConversationAgentSession>
  private readonly agentMessageRepository: Repository<AgentMessage>
  private readonly conversationAgentSessionConnectRepository: ConnectRepository<ConversationAgentSession>
  private readonly agentMessageConnectRepository: ConnectRepository<AgentMessage>

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

  /**
   * Finds a session by ID and recovers aborted streams
   */
  async findById(sessionId: string): Promise<ConversationAgentSession | null> {
    const session = await this.conversationAgentSessionRepository.findOne({
      where: { id: sessionId },
      relations: ["messages"],
    })

    if (!session) {
      return null
    }

    // Recover aborted streams
    await this.recoverAbortedStreams(sessionId)

    // Reload session with updated messages
    return this.conversationAgentSessionRepository.findOne({
      where: { id: sessionId },
      relations: ["messages"],
    })
  }

  /**
   * Prepares session for streaming
   * Persists user message + empty assistant message with status "streaming"
   */
  async prepareForStreaming({
    connectScope,
    sessionId,
    userContent,
    documentId,
  }: {
    connectScope: RequiredConnectScope
    sessionId: string
    userContent: string
    documentId?: string
  }): Promise<{ session: ConversationAgentSession; assistantMessageId: string }> {
    const session = await this.findById(sessionId)

    if (!session) {
      throw new NotFoundException(`ConversationAgentSession with id ${sessionId} not found`)
    }

    // Create user message
    await this.agentMessageConnectRepository.createAndSave(connectScope, {
      sessionId,
      role: "user",
      content: userContent,
      status: null,
      startedAt: null,
      completedAt: null,
      toolCalls: null,
      documentId: documentId ?? null,
    })

    // Create empty assistant message with streaming status
    const assistantMessageId = v4()
    await this.agentMessageConnectRepository.createAndSave(connectScope, {
      id: assistantMessageId,
      sessionId,
      role: "assistant",
      content: "",
      status: "streaming",
      startedAt: new Date(),
      completedAt: null,
      toolCalls: null,
    })

    // Reload session with messages
    const updatedSession = await this.conversationAgentSessionRepository.findOne({
      where: { id: sessionId },
      relations: ["messages"],
    })

    if (!updatedSession) {
      throw new NotFoundException(`ConversationAgentSession with id ${sessionId} not found`)
    }

    return { session: updatedSession, assistantMessageId }
  }

  /**
   * Finalizes streaming by updating assistant message
   * Sets status to "completed" and adds full content
   */
  async finalizeStreaming(
    sessionId: string,
    assistantMessageId: string,
    fullContent: string,
  ): Promise<ConversationAgentSession> {
    const message = await this.agentMessageRepository.findOne({
      where: { id: assistantMessageId, sessionId },
    })

    if (!message) {
      throw new NotFoundException(
        `ChatMessage with id ${assistantMessageId} not found in session ${sessionId}`,
      )
    }

    message.content = fullContent
    message.status = "completed"
    message.completedAt = new Date()
    await this.agentMessageRepository.save(message)

    const session = await this.conversationAgentSessionRepository.findOne({
      where: { id: sessionId },
      relations: ["messages"],
    })

    if (!session) {
      throw new NotFoundException(`ConversationAgentSession with id ${sessionId} not found`)
    }

    return session
  }

  /**
   * Marks a streaming message as error
   */
  async markStreamingError(
    sessionId: string,
    assistantMessageId: string,
    errorMessage: string,
  ): Promise<ConversationAgentSession> {
    const message = await this.agentMessageRepository.findOne({
      where: { id: assistantMessageId, sessionId },
    })

    if (!message) {
      throw new NotFoundException(
        `ChatMessage with id ${assistantMessageId} not found in session ${sessionId}`,
      )
    }

    message.content = errorMessage
    message.status = "error"
    message.completedAt = new Date()
    await this.agentMessageRepository.save(message)

    const session = await this.conversationAgentSessionRepository.findOne({
      where: { id: sessionId },
      relations: ["messages"],
    })

    if (!session) {
      throw new NotFoundException(`ConversationAgentSession with id ${sessionId} not found`)
    }

    return session
  }

  /**
   * Recovers aborted streams in a session
   * Marks old "streaming" messages as "aborted"
   */
  private async recoverAbortedStreams(sessionId: string): Promise<void> {
    const messages = await this.agentMessageRepository.find({
      where: {
        sessionId,
        role: "assistant",
        status: "streaming",
      },
    })

    const _now = new Date()
    for (const message of messages) {
      if (this.isStreamAborted(message)) {
        message.status = "aborted"
        await this.agentMessageRepository.save(message)
      }
    }
  }

  /**
   * Checks if a streaming message should be marked as aborted
   */
  private isStreamAborted(message: AgentMessage): boolean {
    if (!message.startedAt) {
      return false
    }

    const startedAt =
      message.startedAt instanceof Date ? message.startedAt : new Date(message.startedAt)
    const now = new Date()
    const elapsed = now.getTime() - startedAt.getTime()

    return elapsed > this.STREAM_TIMEOUT_MS
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
