import type { AgentMessageFeedbackDto } from "@caseai-connect/api-contracts"
import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { In, type Repository } from "typeorm"
import { getTraceUrl } from "@/external/langfuse/langfuse-helper"
import { AgentMessage } from "../agent-sessions/agent-message.entity"
import { AgentMessageFeedback } from "./agent-message-feedback.entity"

@Injectable()
export class AgentMessageFeedbackService {
  constructor(
    @InjectRepository(AgentMessageFeedback)
    private readonly feedbackRepository: Repository<AgentMessageFeedback>,
    @InjectRepository(AgentMessage)
    private readonly agentMessageRepository: Repository<AgentMessage>,
  ) {}

  async createFeedback({
    userId,
    agentMessageId,
    content,
  }: {
    userId: string
    agentMessageId: string
    content: string
  }): Promise<AgentMessageFeedback> {
    const agentMessage = await this.agentMessageRepository.findOne({
      where: { id: agentMessageId },
      relations: ["session", "session.agent", "session.agent.project"],
    })

    if (!agentMessage) {
      throw new NotFoundException(`Agent message with id ${agentMessageId} not found`)
    }

    const project = agentMessage.session.agent.project
    const organizationId = project.organizationId

    const feedback = this.feedbackRepository.create({
      userId,
      agentMessageId,
      projectId: project.id,
      organizationId,
      content,
    })

    return this.feedbackRepository.save(feedback)
  }

  async listFeedbacksForAgent(agentId: string): Promise<AgentMessageFeedbackDto[]> {
    const agentMessages = await this.agentMessageRepository.find({
      where: { session: { agentId } },
      relations: ["session"],
    })
    const agentMessageIds = agentMessages.map((message) => message.id)
    const feedbacks = await this.feedbackRepository.find({
      where: { agentMessageId: In(agentMessageIds) },
      order: { createdAt: "DESC" },
    })
    return feedbacks
      .map((f) => {
        const agentMessage = agentMessages.find((m) => m.id === f.agentMessageId)
        const traceUrl = agentMessage?.session.traceId
          ? getTraceUrl(agentMessage.session.traceId)
          : undefined
        if (!agentMessage) return null

        return {
          id: f.id,
          organizationId: f.organizationId,
          projectId: f.projectId,
          agentId,
          agentSessionId: agentMessage.session.id,
          agentMessageId: f.agentMessageId,
          agentMessageContent: agentMessage.content,
          userId: f.userId,
          content: f.content,
          createdAt: f.createdAt.getTime(),
          traceUrl,
        } satisfies AgentMessageFeedbackDto
      })
      .filter((f) => f !== null)
  }

  async findById(feedbackId: string): Promise<AgentMessageFeedback> {
    const feedback = await this.feedbackRepository.findOne({
      where: { id: feedbackId },
    })

    if (!feedback) {
      throw new NotFoundException(`Feedback with id ${feedbackId} not found`)
    }

    return feedback
  }
}
