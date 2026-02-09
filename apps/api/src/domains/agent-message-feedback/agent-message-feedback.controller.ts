import {
  type AgentMessageFeedbackDto,
  AgentMessageFeedbackRoutes,
} from "@caseai-connect/api-contracts"
import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { OrganizationGuard } from "@/domains/organizations/organization.guard"
import { ProjectsGuard } from "@/domains/projects/projects.guard"
import { UserGuard } from "@/domains/users/user.guard"
import type { EndpointRequestWithProject } from "@/request.interface"
import type { AgentMessageFeedback } from "./agent-message-feedback.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentMessageFeedbackService } from "./agent-message-feedback.service"

@UseGuards(JwtAuthGuard, UserGuard, OrganizationGuard, ProjectsGuard)
@Controller()
export class AgentMessageFeedbackController {
  constructor(private readonly feedbackService: AgentMessageFeedbackService) {}

  @Post(AgentMessageFeedbackRoutes.createOne.path)
  async createOne(
    @Req() request: EndpointRequestWithProject,
    @Param("agentMessageId") agentMessageId: string,
    @Body() { payload }: typeof AgentMessageFeedbackRoutes.createOne.request,
  ): Promise<typeof AgentMessageFeedbackRoutes.createOne.response> {
    const user = request.user

    const feedback = await this.feedbackService.createFeedback({
      userId: user.id,
      agentMessageId,
      content: payload.content,
    })

    return { data: toFeedbackDto(feedback) }
  }

  @Get(AgentMessageFeedbackRoutes.getAll.path)
  async getAll(
    // @Req() request: EndpointRequestWithProject,
    @Param("agentMessageId") agentMessageId: string,
  ): Promise<typeof AgentMessageFeedbackRoutes.getAll.response> {
    // const user = request.user

    const feedbacks = await this.feedbackService.listFeedbacksForAgent(agentMessageId)

    return { data: { feedbacks: feedbacks.map(toFeedbackDto) } }
  }
}

function toFeedbackDto(entity: AgentMessageFeedback): AgentMessageFeedbackDto {
  return {
    id: entity.id,
    organizationId: entity.organizationId,
    projectId: entity.projectId,
    agentMessageId: entity.agentMessageId,
    userId: entity.userId,
    content: entity.content,
    createdAt: entity.createdAt.getTime(),
    updatedAt: entity.updatedAt.getTime(),
  }
}
