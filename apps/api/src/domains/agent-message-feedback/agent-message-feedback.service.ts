import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { In, type Repository } from "typeorm"
import { ConnectRepository } from "@/common/entities/connect-repository"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
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
    connectRequiredFields: RequiredConnectScope
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
    connectRequiredFields: RequiredConnectScope
    agentId: string
  }): Promise<{
    agentMessages: AgentMessage[]
    agentMessageFeedbacks: AgentMessageFeedback[]
  }> {
    const agentMessages = await this.agentMessageConnectRepository.find(connectRequiredFields, {
      where: { session: { agentId } },
      relations: ["session"],
    })
    const agentMessageIds = agentMessages.map((message) => message.id)
    const agentMessageFeedbacks = await this.feedbackConnectRepository.find(connectRequiredFields, {
      where: { agentMessageId: In(agentMessageIds) },
      order: { createdAt: "DESC" },
    })
    return {
      agentMessages,
      agentMessageFeedbacks,
    }
  }

  async findById({
    connectRequiredFields,
    feedbackId,
  }: {
    connectRequiredFields: RequiredConnectScope
    feedbackId: string
  }): Promise<AgentMessageFeedback | null> {
    return await this.feedbackConnectRepository.getOneById(connectRequiredFields, feedbackId)
  }
}
