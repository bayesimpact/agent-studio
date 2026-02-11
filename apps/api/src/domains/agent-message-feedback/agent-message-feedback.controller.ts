import {
  type AgentMessageFeedbackDto,
  AgentMessageFeedbackRoutes,
} from "@caseai-connect/api-contracts"
import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
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

  @CheckPolicy((policy) => policy.canCreate())
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

  @CheckPolicy((policy) => policy.canList())
  @Get(AgentMessageFeedbackRoutes.getAll.path)
  async getAll(
    // @Req() request: EndpointRequestWithProject,
    @Param("agentId") agentId: string,
  ): Promise<typeof AgentMessageFeedbackRoutes.getAll.response> {
    // FIXME: user request.agentId when AgentGuard will be added

    const feedbacks = await this.feedbackService.listFeedbacksForAgent(agentId)

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
