import type { AgentDto } from "@caseai-connect/api-contracts"
import { Body, Controller, Delete, Get, Patch, Post, Req, UseGuards } from "@nestjs/common"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { UserGuard } from "@/domains/users/user.guard"
import {
  type EndpointRequestWithAgent,
  type EndpointRequestWithProject,
  toConnectRequiredFields,
} from "@/request.interface"
import { OrganizationGuard } from "../organizations/organization.guard"
import { ProjectsGuard } from "../projects/projects.guard"
import type { Agent } from "./agent.entity"
import { AgentGuard } from "./agent.guard"
import { AgentsRoutes } from "./agents.routes"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentsService } from "./agents.service"

@UseGuards(JwtAuthGuard, UserGuard, OrganizationGuard, ProjectsGuard, AgentGuard)
@Controller()
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post(AgentsRoutes.createOne.path)
  @CheckPolicy((policy) => policy.canCreate())
  async createOne(
    @Req() request: EndpointRequestWithProject,
    @Body() { payload }: typeof AgentsRoutes.createOne.request,
  ): Promise<typeof AgentsRoutes.createOne.response> {
    const agent = await this.agentsService.createAgent({
      connectRequiredFields: toConnectRequiredFields(request),
      fields: payload,
    })

    return { data: toAgentDto(agent) }
  }

  @Get(AgentsRoutes.getAll.path)
  @CheckPolicy((policy) => policy.canList())
  async getAll(
    @Req() request: EndpointRequestWithProject,
  ): Promise<typeof AgentsRoutes.getAll.response> {
    const agents = await this.agentsService.listAgents(toConnectRequiredFields(request))

    return { data: { agents: agents.map(toAgentDto) } }
  }

  @Patch(AgentsRoutes.updateOne.path)
  @CheckPolicy((policy) => policy.canUpdate())
  async updateOne(
    @Req() request: EndpointRequestWithAgent,
    @Body() { payload }: typeof AgentsRoutes.updateOne.request,
  ): Promise<typeof AgentsRoutes.updateOne.response> {
    const agentId = request.agent.id

    const agent = await this.agentsService.updateAgent({
      connectRequiredFields: toConnectRequiredFields(request),
      required: { agentId },
      fieldsToUpdate: payload,
    })

    if (!agent) {
      throw new Error("Agent not updated")
    }
    return { data: { success: true } }
  }

  @Delete(AgentsRoutes.deleteOne.path)
  @CheckPolicy((policy) => policy.canDelete())
  async deleteOne(
    @Req() request: EndpointRequestWithAgent,
  ): Promise<typeof AgentsRoutes.deleteOne.response> {
    await this.agentsService.deleteAgent({
      connectRequiredFields: toConnectRequiredFields(request),
      agentId: request.agent.id,
    })
    return { data: { success: true } }
  }
}

function toAgentDto(entity: Agent): AgentDto {
  return {
    createdAt: entity.createdAt.getTime(),
    defaultPrompt: entity.defaultPrompt,
    id: entity.id,
    locale: entity.locale,
    model: entity.model,
    name: entity.name,
    projectId: entity.projectId,
    temperature: entity.temperature,
    updatedAt: entity.updatedAt.getTime(),
  }
}
