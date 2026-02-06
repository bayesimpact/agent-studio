import type { AgentSessionMessageDto } from "@caseai-connect/api-contracts"
import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { v4 } from "uuid"
import { Agent } from "@/agents/agent.entity"
import { UserMembership } from "@/organizations/user-membership.entity"
import { AgentMessage } from "./agent-message.entity"
import { AgentSession, type AgentSessionType } from "./agent-session.entity"

@Injectable()
export class AgentSessionsService {
  private readonly STREAM_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

  constructor(
    @InjectRepository(AgentSession)
    private readonly agentSessionRepository: Repository<AgentSession>,
    @InjectRepository(AgentMessage)
    private readonly agentMessageRepository: Repository<AgentMessage>,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
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
  ): Promise<AgentSessionMessageDto[]> {
    const session = await this.agentSessionRepository.findOne({
      where: { id: sessionId },
    })

    if (!session) {
      throw new NotFoundException(`AgentSession with id ${sessionId} not found`)
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

    const messages = await this.agentMessageRepository.find({
      where: { sessionId },
      order: { createdAt: "ASC" },
    })

    return messages.map((message) => this.toDto(message))
  }

  /**
   * Loads a session and its agent, ensuring the session belongs to the user.
   * Used by streaming controller to prepare for LLM calls.
   */
  async getSessionWithAgentForUser(
    sessionId: string,
    userId: string,
  ): Promise<{ session: AgentSession; agent: Agent }> {
    const session = await this.agentSessionRepository.findOne({
      where: { id: sessionId },
      relations: ["messages"],
    })

    if (!session) {
      throw new NotFoundException(`AgentSession with id ${sessionId} not found`)
    }

    if (session.userId !== userId) {
      throw new ForbiddenException("User does not own this session")
    }

    const agent = await this.agentRepository.findOne({
      where: { id: session.agentId },
    })

    if (!agent) {
      throw new NotFoundException(`Agent with id ${session.agentId} not found`)
    }

    return { session, agent }
  }

  async getAllSessionsForAgent({
    agentId,
    userId,
    type,
  }: {
    agentId: string
    userId: string
    type: AgentSessionType
  }): Promise<AgentSession[]> {
    return await this.agentSessionRepository.find({
      where: {
        agentId,
        userId,
        type,
      },
      order: {
        createdAt: "DESC",
      },
    })
  }

  async createPlaygroundSession(
    agentId: string,
    userId: string,
    organizationId: string,
  ): Promise<AgentSession> {
    const session = this.agentSessionRepository.create({
      agentId,
      userId,
      organizationId,
      type: "playground",
      expiresAt: null,
      traceId: v4(),
    })

    return this.agentSessionRepository.save(session)
  }

  /**
   * Verifies that a user can create a playground session for a agent.
   * User must be an admin or owner of the agent's project's organization.
   * Throws ForbiddenException if the user is not a member.
   */
  async verifyUserCanCreatePlaygroundSession(
    userId: string,
    agentId: string,
  ): Promise<{ organizationId: string }> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
      relations: ["project"],
    })

    if (!agent) {
      throw new NotFoundException(`Agent with id ${agentId} not found`)
    }

    const membership = await this.membershipRepository.findOne({
      where: {
        userId,
        organizationId: agent.project.organizationId,
      },
    })

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new ForbiddenException(
        `User does not have access to organization ${agent.project.organizationId}`,
      )
    }

    return { organizationId: agent.project.organizationId }
  }

  async verifyUserCanCreateAppPrivateSession(
    userId: string,
    agentId: string,
  ): Promise<{ organizationId: string }> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
      relations: ["project"],
    })

    if (!agent) {
      throw new NotFoundException(`Agent with id ${agentId} not found`)
    }

    const membership = await this.membershipRepository.findOne({
      where: {
        userId,
        organizationId: agent.project.organizationId,
      },
    })

    if (!membership) {
      throw new ForbiddenException(
        `User does not have access to organization ${agent.project.organizationId}`,
      )
    }

    return { organizationId: agent.project.organizationId }
  }

  async createAppPrivateSession({
    agentId,
    userId,
    organizationId,
  }: {
    agentId: string
    userId: string
    organizationId: string
  }): Promise<AgentSession> {
    const session = this.agentSessionRepository.create({
      agentId,
      userId,
      organizationId,
      type: "app-private",
      expiresAt: null,
      traceId: v4(),
    })
    return await this.agentSessionRepository.save(session)
  }

  /**
   * Creates a new production session
   * No TTL (expiresAt is null)
   */
  async createProductionSession(
    agentId: string,
    userId: string,
    organizationId: string,
  ): Promise<AgentSession> {
    const session = this.agentSessionRepository.create({
      agentId,
      userId,
      organizationId,
      type: "production",
      expiresAt: null,
      traceId: v4(),
    })

    return this.agentSessionRepository.save(session)
  }

  /**
   * Finds a session by ID and recovers aborted streams
   */
  async findById(sessionId: string): Promise<AgentSession | null> {
    const session = await this.agentSessionRepository.findOne({
      where: { id: sessionId },
      relations: ["messages"],
    })

    if (!session) {
      return null
    }

    // Recover aborted streams
    await this.recoverAbortedStreams(sessionId)

    // Reload session with updated messages
    return this.agentSessionRepository.findOne({
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
  ): Promise<{ session: AgentSession; assistantMessageId: string }> {
    const session = await this.findById(sessionId)

    if (!session) {
      throw new NotFoundException(`AgentSession with id ${sessionId} not found`)
    }

    // Create user message
    const userMessage = this.agentMessageRepository.create({
      sessionId,
      role: "user",
      content: userContent,
      status: null,
      startedAt: null,
      completedAt: null,
      toolCalls: null,
    })
    await this.agentMessageRepository.save(userMessage)

    // Create empty assistant message with streaming status
    const assistantMessageId = v4()
    const assistantMessage = this.agentMessageRepository.create({
      id: assistantMessageId,
      sessionId,
      role: "assistant",
      content: "",
      status: "streaming",
      startedAt: new Date(),
      completedAt: null,
      toolCalls: null,
    })
    await this.agentMessageRepository.save(assistantMessage)

    // Reload session with messages
    const updatedSession = await this.agentSessionRepository.findOne({
      where: { id: sessionId },
      relations: ["messages"],
    })

    if (!updatedSession) {
      throw new NotFoundException(`AgentSession with id ${sessionId} not found`)
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
  ): Promise<AgentSession> {
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

    const session = await this.agentSessionRepository.findOne({
      where: { id: sessionId },
      relations: ["messages"],
    })

    if (!session) {
      throw new NotFoundException(`AgentSession with id ${sessionId} not found`)
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
  ): Promise<AgentSession> {
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

    const session = await this.agentSessionRepository.findOne({
      where: { id: sessionId },
      relations: ["messages"],
    })

    if (!session) {
      throw new NotFoundException(`AgentSession with id ${sessionId} not found`)
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
   * Converts ChatMessage entity to DTO
   */
  private toDto(message: AgentMessage): AgentSessionMessageDto {
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
   * Deletes all playground sessions for a agent
   * Called when agent configuration changes
   */
  async deletePlaygroundSessionsForAgent(agentId: string): Promise<void> {
    await this.agentSessionRepository.delete({
      agentId,
      type: "playground",
    })
  }

  /**
   * Deletes all sessions for a agent
   * Called when deleting a agent
   */
  async deleteAllSessionsForAgent(agentId: string): Promise<void> {
    await this.agentSessionRepository.delete({
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

    const result = await this.agentSessionRepository
      .createQueryBuilder()
      .delete()
      .from(AgentSession)
      .where("type = :type", { type: "playground" })
      .andWhere("expires_at < :cutoff", { cutoff: fiveMinutesAgo })
      .execute()

    return result.affected || 0
  }
}
