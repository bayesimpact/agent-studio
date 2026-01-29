import type { ChatSessionMessageDto } from "@caseai-connect/api-contracts"
import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { v4 } from "uuid"
import { ChatBot } from "@/chat-bots/chat-bot.entity"
import { UserMembership } from "@/organizations/user-membership.entity"
import { ChatSession } from "./chat-session.entity"

export type MessageStatus = "streaming" | "completed" | "aborted" | "error"

export interface ChatMessageInput {
  id: string
  role: "user" | "assistant"
  content: string
  status?: MessageStatus
  createdAt?: string
  startedAt?: string
  completedAt?: string
  toolCalls?: Array<{
    id: string
    name: string
    arguments: Record<string, unknown>
  }>
}

@Injectable()
export class ChatSessionsService {
  private readonly STREAM_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

  constructor(
    @InjectRepository(ChatSession)
    private readonly chatSessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatBot)
    private readonly chatBotRepository: Repository<ChatBot>,
    @InjectRepository(UserMembership)
    private readonly membershipRepository: Repository<UserMembership>,
  ) {}

  /**
   * Returns messages for a session after verifying that the user
   * belongs to the session's organization.
   */
  async listMessagesForSession(
    sessionId: string,
    userId: string,
  ): Promise<ChatSessionMessageDto[]> {
    const session = await this.chatSessionRepository.findOne({
      where: { id: sessionId },
    })

    if (!session) {
      throw new NotFoundException(`ChatSession with id ${sessionId} not found`)
    }

    const membership = await this.membershipRepository.findOne({
      where: {
        userId,
        organizationId: session.organizationId,
      },
    })

    if (!membership) {
      throw new ForbiddenException(
        `User does not have access to organization ${session.organizationId}`,
      )
    }

    return session.messages as ChatSessionMessageDto[]
  }

  /**
   * Loads a session and its chatbot, ensuring the session belongs to the user.
   * Used by streaming controller to prepare for LLM calls.
   */
  async getSessionWithChatBotForUser(
    sessionId: string,
    userId: string,
  ): Promise<{ session: ChatSession; chatBot: ChatBot }> {
    const session = await this.chatSessionRepository.findOne({
      where: { id: sessionId },
    })

    if (!session) {
      throw new NotFoundException(`ChatSession with id ${sessionId} not found`)
    }

    if (session.userId !== userId) {
      throw new ForbiddenException("User does not own this session")
    }

    const chatBot = await this.chatBotRepository.findOne({
      where: { id: session.chatbotId },
    })

    if (!chatBot) {
      throw new NotFoundException(`ChatBot with id ${session.chatbotId} not found`)
    }

    return { session, chatBot }
  }

  /**
   * Creates or reuses a playground session for a user and chatbot
   * - If session exists and TTL not expired: returns existing session
   * - If session exists but TTL expired: resets messages and updates TTL
   * - If session doesn't exist: creates new session
   * Sets TTL to 24 hours from now
   */
  async createPlaygroundSession(
    chatbotId: string,
    userId: string,
    organizationId: string,
  ): Promise<ChatSession> {
    // Look for existing playground session for this user and chatbot
    const existingSession = await this.chatSessionRepository.findOne({
      where: {
        chatbotId,
        userId,
        organizationId,
        type: "playground",
      },
    })

    const now = new Date()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours TTL

    if (existingSession) {
      // Check if TTL expired
      if (existingSession.expiresAt && existingSession.expiresAt < now) {
        // TTL expired: reset messages and update TTL
        existingSession.messages = []
        existingSession.expiresAt = expiresAt
        return this.chatSessionRepository.save(existingSession)
      }

      // TTL not expired: return existing session
      return existingSession
    }

    // No existing session: create new one
    const session = this.chatSessionRepository.create({
      chatbotId,
      userId,
      organizationId,
      type: "playground",
      messages: [],
      expiresAt,
    })

    return this.chatSessionRepository.save(session)
  }

  /**
   * Verifies that a user can create a playground session for a chat bot.
   * User must be an admin or owner of the chat bot's project's organization.
   * Throws ForbiddenException if the user is not a member.
   */
  private async verifyUserCanCreatePlaygroundSession(
    userId: string,
    chatbotId: string,
  ): Promise<{ organizationId: string }> {
    const chatBot = await this.chatBotRepository.findOne({
      where: { id: chatbotId },
      relations: ["project"],
    })

    if (!chatBot) {
      throw new NotFoundException(`ChatBot with id ${chatbotId} not found`)
    }

    const membership = await this.membershipRepository.findOne({
      where: {
        userId,
        organizationId: chatBot.project.organizationId,
      },
    })

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new ForbiddenException(
        `User does not have access to organization ${chatBot.project.organizationId}`,
      )
    }

    return { organizationId: chatBot.project.organizationId }
  }

  /**
   * Creates or reuses a playground session for a user and chatbot,
   * performing organization membership checks based on the chatbot's project.
   */
  async createPlaygroundSessionForChatBot(chatbotId: string, userId: string): Promise<ChatSession> {
    const { organizationId } = await this.verifyUserCanCreatePlaygroundSession(userId, chatbotId)
    return this.createPlaygroundSession(chatbotId, userId, organizationId)
  }

  /**
   * Creates a new production session
   * No TTL (expiresAt is null)
   */
  async createProductionSession(
    chatbotId: string,
    userId: string,
    organizationId: string,
  ): Promise<ChatSession> {
    const session = this.chatSessionRepository.create({
      chatbotId,
      userId,
      organizationId,
      type: "production",
      messages: [],
      expiresAt: null,
    })

    return this.chatSessionRepository.save(session)
  }

  /**
   * Finds a session by ID and recovers aborted streams
   */
  async findById(sessionId: string): Promise<ChatSession | null> {
    const session = await this.chatSessionRepository.findOne({
      where: { id: sessionId },
    })

    if (!session) {
      return null
    }

    // Recover aborted streams
    this.recoverAbortedStreams(session)

    // If we recovered any streams, persist the changes
    const needsUpdate = session.messages.some(
      (message) =>
        message.role === "assistant" &&
        message.status === "streaming" &&
        this.isStreamAborted(message),
    )

    if (needsUpdate) {
      // Update messages in place
      session.messages = session.messages.map((message) => {
        if (
          message.role === "assistant" &&
          message.status === "streaming" &&
          this.isStreamAborted(message)
        ) {
          return {
            ...message,
            status: "aborted",
          }
        }
        return message
      })
      await this.chatSessionRepository.save(session)
    }

    return session
  }

  /**
   * Prepares session for streaming
   * Persists user message + empty assistant message with status "streaming"
   */
  async prepareForStreaming(
    sessionId: string,
    userContent: string,
  ): Promise<{ session: ChatSession; assistantMessageId: string }> {
    const session = await this.findById(sessionId)

    if (!session) {
      throw new NotFoundException(`ChatSession with id ${sessionId} not found`)
    }

    // Add user message
    const userMessage: ChatMessageInput = {
      id: v4(),
      role: "user",
      content: userContent,
      createdAt: new Date().toISOString(),
    }

    // Add empty assistant message with streaming status
    const assistantMessageId = v4()
    const assistantMessage: ChatMessageInput = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      status: "streaming",
      startedAt: new Date().toISOString(),
    }

    session.messages = [...session.messages, userMessage, assistantMessage]

    await this.chatSessionRepository.save(session)

    return { session, assistantMessageId }
  }

  /**
   * Finalizes streaming by updating assistant message
   * Sets status to "completed" and adds full content
   */
  async finalizeStreaming(
    sessionId: string,
    assistantMessageId: string,
    fullContent: string,
  ): Promise<ChatSession> {
    const session = await this.findById(sessionId)

    if (!session) {
      throw new NotFoundException(`ChatSession with id ${sessionId} not found`)
    }

    // Update assistant message
    session.messages = session.messages.map((message) => {
      if (message.id === assistantMessageId) {
        return {
          ...message,
          content: fullContent,
          status: "completed" as MessageStatus,
          completedAt: new Date().toISOString(),
        }
      }
      return message
    })

    return this.chatSessionRepository.save(session)
  }

  /**
   * Marks a streaming message as error
   */
  async markStreamingError(
    sessionId: string,
    assistantMessageId: string,
    errorMessage: string,
  ): Promise<ChatSession> {
    const session = await this.findById(sessionId)

    if (!session) {
      throw new NotFoundException(`ChatSession with id ${sessionId} not found`)
    }

    session.messages = session.messages.map((message) => {
      if (message.id === assistantMessageId) {
        return {
          ...message,
          content: errorMessage,
          status: "error" as MessageStatus,
          completedAt: new Date().toISOString(),
        }
      }
      return message
    })

    return this.chatSessionRepository.save(session)
  }

  /**
   * Recovers aborted streams in a session
   * Marks old "streaming" messages as "aborted"
   */
  private recoverAbortedStreams(session: ChatSession): void {
    session.messages = session.messages.map((message) => {
      if (
        message.role === "assistant" &&
        message.status === "streaming" &&
        this.isStreamAborted(message)
      ) {
        return {
          ...message,
          status: "aborted" as MessageStatus,
        }
      }
      return message
    })
  }

  /**
   * Checks if a streaming message should be marked as aborted
   */
  private isStreamAborted(message: ChatMessageInput): boolean {
    if (!message.startedAt) {
      return false
    }

    const startedAt = new Date(message.startedAt)
    const now = new Date()
    const elapsed = now.getTime() - startedAt.getTime()

    return elapsed > this.STREAM_TIMEOUT_MS
  }

  /**
   * Deletes all playground sessions for a chatbot
   * Called when chatbot configuration changes
   */
  async deletePlaygroundSessionsForChatBot(chatbotId: string): Promise<void> {
    await this.chatSessionRepository.delete({
      chatbotId,
      type: "playground",
    })
  }

  /**
   * Deletes all sessions for a chatbot
   * Called when deleting a chatbot
   */
  async deleteAllSessionsForChatBot(chatbotId: string): Promise<void> {
    await this.chatSessionRepository.delete({
      chatbotId,
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

    const result = await this.chatSessionRepository
      .createQueryBuilder()
      .delete()
      .from(ChatSession)
      .where("type = :type", { type: "playground" })
      .andWhere("expires_at < :cutoff", { cutoff: fiveMinutesAgo })
      .execute()

    return result.affected || 0
  }
}
