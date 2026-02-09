import type { AgentDto } from "@caseai-connect/api-contracts"
import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { UserGuard } from "@/guards/user.guard"
import type { EndpointRequest } from "@/request.interface"
import type { Agent } from "./agent.entity"
import { AgentsRoutes } from "./agents.routes"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentsService } from "./agents.service"

@UseGuards(JwtAuthGuard, UserGuard)
@Controller()
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post(AgentsRoutes.createOne.path)
  async createOne(
    @Req() request: EndpointRequest,
    @Param("projectId") projectId: string,
    @Body() { payload }: typeof AgentsRoutes.createOne.request,
  ): Promise<typeof AgentsRoutes.createOne.response> {
    const user = request.user

    const agent = await this.agentsService.createAgent({
      userId: user.id,
      projectId,
      ...payload,
    })

    return { data: toAgentDto(agent) }
  }

  @Get(AgentsRoutes.getAll.path)
  async getAll(
    @Req() request: EndpointRequest,
    @Param("projectId") projectId: string,
  ): Promise<typeof AgentsRoutes.getAll.response> {
    const user = request.user

    const agents = await this.agentsService.listAgents({ userId: user.id, projectId })

    return { data: { agents: agents.map(toAgentDto) } }
  }

  @Patch(AgentsRoutes.updateOne.path)
  async updateOne(
    @Req() request: EndpointRequest,
    @Param("agentId") agentId: string,
    @Body() { payload }: typeof AgentsRoutes.updateOne.request,
  ): Promise<typeof AgentsRoutes.updateOne.response> {
    const user = request.user

    const agent = await this.agentsService.updateAgent({
      required: { userId: user.id, agentId },
      fieldsToUpdate: payload,
    })

    if (!agent) {
      throw new Error("Agent not updated")
    }
    return { data: { success: true } }
  }

  @Delete(AgentsRoutes.deleteOne.path)
  async deleteOne(
    @Req() request: EndpointRequest,
    @Param("agentId") agentId: string,
  ): Promise<typeof AgentsRoutes.deleteOne.response> {
    await this.agentsService.deleteAgent(request.user.id, agentId)
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
