import {
  type AgentMessageFeedbackDto,
  AgentMessageFeedbackRoutes,
} from "@caseai-connect/api-contracts"
import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common"
import type {
  EndpointRequestWithAgent,
  EndpointRequestWithProject,
} from "@/common/context/request.interface"
import { toConnectRequiredFields } from "@/common/context/request-context.helpers"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { OrganizationGuard } from "@/domains/organizations/organization.guard"
import { ProjectsGuard } from "@/domains/projects/projects.guard"
import { UserGuard } from "@/domains/users/user.guard"
import { getTraceUrl } from "@/external/langfuse/langfuse-helper"
import type { AgentMessage } from "../agent-sessions/agent-message.entity"
import { AgentGuard } from "../agents/agent.guard"
import type { AgentMessageFeedback } from "./agent-message-feedback.entity"
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
      connectRequiredFields: toConnectRequiredFields(request),
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
    const data = await this.feedbackService.listFeedbacksForAgent({
      connectRequiredFields: toConnectRequiredFields(request),
      agentId: request.agent.id,
    })

    return {
      data: {
        feedbacks: toDto({
          agentMessageEntities: data.agentMessages,
          agentMessageFeedbackEntities: data.agentMessageFeedbacks,
          agentId: request.agent.id,
        }),
      },
    }
  }
}

function toDto({
  agentMessageEntities,
  agentMessageFeedbackEntities,
  agentId,
}: {
  agentMessageEntities: AgentMessage[]
  agentMessageFeedbackEntities: AgentMessageFeedback[]
  agentId: string
}): AgentMessageFeedbackDto[] {
  return agentMessageFeedbackEntities
    .map((f) => {
      const agentMessage = agentMessageEntities.find((m) => m.id === f.agentMessageId)
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
