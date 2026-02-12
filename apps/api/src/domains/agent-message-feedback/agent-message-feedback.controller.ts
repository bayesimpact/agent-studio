import { AgentMessageFeedbackRoutes } from "@caseai-connect/api-contracts"
import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { OrganizationGuard } from "@/domains/organizations/organization.guard"
import { ProjectsGuard } from "@/domains/projects/projects.guard"
import { UserGuard } from "@/domains/users/user.guard"
import type { EndpointRequestWithAgent, EndpointRequestWithProject } from "@/request.interface"
import { AgentGuard } from "../agents/agent.guard"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentMessageFeedbackService } from "./agent-message-feedback.service"

@UseGuards(JwtAuthGuard, UserGuard, OrganizationGuard, ProjectsGuard)
@Controller()
export class AgentMessageFeedbackController {
  constructor(private readonly feedbackService: AgentMessageFeedbackService) {}

  // TODO: add a AgentMessageGuard
  @CheckPolicy((policy) => policy.canList())
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

    if (!feedback) throw new Error("Failed to create feedback")

    return { data: { success: true } }
  }

  @UseGuards(AgentGuard)
  @CheckPolicy((policy) => policy.canList())
  @Get(AgentMessageFeedbackRoutes.getAll.path)
  async getAll(
    @Req() request: EndpointRequestWithAgent,
  ): Promise<typeof AgentMessageFeedbackRoutes.getAll.response> {
    const feedbacks = await this.feedbackService.listFeedbacksForAgent(request.agent.id)

    return { data: { feedbacks } }
  }
}
