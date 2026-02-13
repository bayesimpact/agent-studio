import type { AgentMessageFeedbackDto } from "@caseai-connect/api-contracts"
import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { In, type Repository } from "typeorm"
import { ConnectRepository } from "@/common/entities/connect-repository"
import type { ConnectRequiredFields } from "@/common/entities/connect-required-fields"
import { getTraceUrl } from "@/external/langfuse/langfuse-helper"
import { AgentMessage } from "../agent-sessions/agent-message.entity"
import { AgentMessageFeedback } from "./agent-message-feedback.entity"

@Injectable()
export class AgentMessageFeedbackService {
  constructor(
    @InjectRepository(AgentMessageFeedback)
    feedbackRepository: Repository<AgentMessageFeedback>,
    @InjectRepository(AgentMessage)
    agentMessageRepository: Repository<AgentMessage>,
  ) {
    this.feedbackConnectRepository = new ConnectRepository(
      feedbackRepository,
      "agent_message_feedbacks",
    )
    this.agentMessageConnectRepository = new ConnectRepository(
      agentMessageRepository,
      "agent_messages",
    )
  }
  private readonly feedbackConnectRepository: ConnectRepository<AgentMessageFeedback>
  private readonly agentMessageConnectRepository: ConnectRepository<AgentMessage>
  async createFeedback({
    connectRequiredFields,
    userId,
    agentMessageId,
    content,
  }: {
    connectRequiredFields: ConnectRequiredFields
    userId: string
    agentMessageId: string
    content: string
  }): Promise<AgentMessageFeedback | null> {
    const agentMessage = await this.agentMessageConnectRepository.getOneById(
      connectRequiredFields,
      agentMessageId,
    )
    if (!agentMessage) {
      return null
    }
    return await this.feedbackConnectRepository.createAndSave(connectRequiredFields, {
      userId,
      agentMessageId,
      content,
    })
  }

  async listFeedbacksForAgent({
    connectRequiredFields,
    agentId,
  }: {
    connectRequiredFields: ConnectRequiredFields
    agentId: string
  }): Promise<AgentMessageFeedbackDto[]> {
    const agentMessages = await this.agentMessageConnectRepository.find(connectRequiredFields, {
      where: { session: { agentId } },
      relations: ["session"],
    })
    const agentMessageIds = agentMessages.map((message) => message.id)
    const feedbacks = await this.feedbackConnectRepository.find(connectRequiredFields, {
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

  async findById({
    connectRequiredFields,
    feedbackId,
  }: {
    connectRequiredFields: ConnectRequiredFields
    feedbackId: string
  }): Promise<AgentMessageFeedback | null> {
    return await this.feedbackConnectRepository.getOneById(connectRequiredFields, feedbackId)
  }
}
