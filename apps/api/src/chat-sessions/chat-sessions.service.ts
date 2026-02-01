import type { ChatSessionMessageDto } from "@caseai-connect/api-contracts"
import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { v4 } from "uuid"
import { ChatBot } from "@/chat-bots/chat-bot.entity"
import { UserMembership } from "@/organizations/user-membership.entity"
import { ChatMessage } from "./chat-message.entity"
import { ChatSession, type ChatSessionType } from "./chat-session.entity"

@Injectable()
export class ChatSessionsService {
  private readonly STREAM_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

  constructor(
    @InjectRepository(ChatSession)
    private readonly chatSessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
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

    const messages = await this.chatMessageRepository.find({
      where: { sessionId },
      order: { createdAt: "ASC" },
    })

    return messages.map((message) => this.toDto(message))
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
      relations: ["messages"],
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

  async getAllSessionsForChatBot({
    chatbotId,
    userId,
    type,
  }: {
    chatbotId: string
    userId: string
    type: ChatSessionType
  }): Promise<ChatSession[]> {
    return await this.chatSessionRepository.find({
      where: {
        chatbotId,
        userId,
        type,
      },
      order: {
        createdAt: "DESC",
      },
    })
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
        // TTL expired: delete all messages and update TTL
        await this.chatMessageRepository.delete({ sessionId: existingSession.id })
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

  private async verifyUserCanCreateAppPrivateSession(
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

    if (!membership) {
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

  async createAppPrivateSession({
    chatbotId,
    userId,
  }: {
    chatbotId: string
    userId: string
  }): Promise<ChatSession> {
    const { organizationId } = await this.verifyUserCanCreateAppPrivateSession(userId, chatbotId)
    // Look for existing playground session for this user and chatbot
    const existingSession = await this.chatSessionRepository.findOne({
      where: {
        chatbotId,
        userId,
        organizationId,
        type: "app-private",
      },
    })

    if (existingSession) return existingSession

    const session = this.chatSessionRepository.create({
      chatbotId,
      userId,
      organizationId,
      type: "app-private",
      expiresAt: null,
    })
    return await this.chatSessionRepository.save(session)
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
      relations: ["messages"],
    })

    if (!session) {
      return null
    }

    // Recover aborted streams
    await this.recoverAbortedStreams(sessionId)

    // Reload session with updated messages
    return this.chatSessionRepository.findOne({
      where: { id: sessionId },
      relations: ["messages"],
    })
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

    // Create user message
    const userMessage = this.chatMessageRepository.create({
      sessionId,
      role: "user",
      content: userContent,
      status: null,
      startedAt: null,
      completedAt: null,
      toolCalls: null,
    })
    await this.chatMessageRepository.save(userMessage)

    // Create empty assistant message with streaming status
    const assistantMessageId = v4()
    const assistantMessage = this.chatMessageRepository.create({
      id: assistantMessageId,
      sessionId,
      role: "assistant",
      content: "",
      status: "streaming",
      startedAt: new Date(),
      completedAt: null,
      toolCalls: null,
    })
    await this.chatMessageRepository.save(assistantMessage)

    // Reload session with messages
    const updatedSession = await this.chatSessionRepository.findOne({
      where: { id: sessionId },
      relations: ["messages"],
    })

    if (!updatedSession) {
      throw new NotFoundException(`ChatSession with id ${sessionId} not found`)
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
  ): Promise<ChatSession> {
    const message = await this.chatMessageRepository.findOne({
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
    await this.chatMessageRepository.save(message)

    const session = await this.chatSessionRepository.findOne({
      where: { id: sessionId },
      relations: ["messages"],
    })

    if (!session) {
      throw new NotFoundException(`ChatSession with id ${sessionId} not found`)
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
  ): Promise<ChatSession> {
    const message = await this.chatMessageRepository.findOne({
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
    await this.chatMessageRepository.save(message)

    const session = await this.chatSessionRepository.findOne({
      where: { id: sessionId },
      relations: ["messages"],
    })

    if (!session) {
      throw new NotFoundException(`ChatSession with id ${sessionId} not found`)
    }

    return session
  }

  /**
   * Recovers aborted streams in a session
   * Marks old "streaming" messages as "aborted"
   */
  private async recoverAbortedStreams(sessionId: string): Promise<void> {
    const messages = await this.chatMessageRepository.find({
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
        await this.chatMessageRepository.save(message)
      }
    }
  }

  /**
   * Checks if a streaming message should be marked as aborted
   */
  private isStreamAborted(message: ChatMessage): boolean {
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
   * Converts ChatMessage entity to DTO
   */
  private toDto(message: ChatMessage): ChatSessionMessageDto {
    return {
      id: message.id,
      role: message.role,
      content: message.content,
      status: message.status ?? undefined,
      createdAt: message.createdAt.toISOString(),
      startedAt: message.startedAt?.toISOString(),
      completedAt: message.completedAt?.toISOString(),
      toolCalls: message.toolCalls ?? undefined,
    }
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
