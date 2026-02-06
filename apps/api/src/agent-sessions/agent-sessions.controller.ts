import type { AgentSessionDto } from "@caseai-connect/api-contracts"
import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "@/auth/jwt-auth.guard"
import { UserGuard } from "@/guards/user.guard"
import type { EndpointRequest } from "@/request.interface"
import type { AgentSession } from "./agent-session.entity"
import { AgentSessionsRoutes } from "./agent-sessions.routes"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentSessionsService } from "./agent-sessions.service"

@UseGuards(JwtAuthGuard, UserGuard)
@Controller()
export class AgentSessionsController {
  constructor(private readonly agentSessionsService: AgentSessionsService) {}

  // FIXME: add ability checks shoud be admin
  @Get(AgentSessionsRoutes.getAllPlayground.path)
  async getAllPlayground(
    @Req() request: EndpointRequest,
    @Param("agentId") agentId: string,
  ): Promise<typeof AgentSessionsRoutes.getAllPlayground.response> {
    const user = request.user

    await this.agentSessionsService.verifyUserCanCreatePlaygroundSession(user.id, agentId)

    const sessions = await this.agentSessionsService.getAllSessionsForAgent({
      agentId: agentId,
      userId: user.id,
      type: "playground",
    })

    return { data: sessions.map(toAgentSessionDto) }
  }

  @Get(AgentSessionsRoutes.getAllApp.path)
  async getAllApp(
    @Req() request: EndpointRequest,
    @Param("agentId") agentId: string,
  ): Promise<typeof AgentSessionsRoutes.getAllApp.response> {
    const user = request.user

    await this.agentSessionsService.verifyUserCanCreateAppPrivateSession(user.id, agentId)

    const sessions = await this.agentSessionsService.getAllSessionsForAgent({
      agentId: agentId,
      userId: user.id,
      type: "app-private",
    })

    return { data: sessions.map(toAgentSessionDto) }
  }

  @Post(AgentSessionsRoutes.createPlaygroundSession.path)
  async createPlaygroundSession(
    @Req() request: EndpointRequest,
    @Param("agentId") agentId: string,
  ): Promise<typeof AgentSessionsRoutes.createPlaygroundSession.response> {
    const user = request.user

    const { organizationId } = await this.agentSessionsService.verifyUserCanCreatePlaygroundSession(
      user.id,
      agentId,
    )

    const session = await this.agentSessionsService.createPlaygroundSession(
      agentId,
      user.id,
      organizationId,
    )

    return { data: toAgentSessionDto(session) }
  }

  @Post(AgentSessionsRoutes.createAppSession.path)
  async createAppSession(
    @Req() request: EndpointRequest,
    @Param("agentId") agentId: string,
    @Body() { payload }: typeof AgentSessionsRoutes.createAppSession.request,
  ): Promise<typeof AgentSessionsRoutes.createAppSession.response> {
    const user = request.user

    if (payload.agentSessionType !== "app-private") {
      throw new Error("Session type not supported.")
    }

    const { organizationId } = await this.agentSessionsService.verifyUserCanCreateAppPrivateSession(
      user.id,
      agentId,
    )

    const session = await this.agentSessionsService.createAppPrivateSession({
      agentId,
      userId: user.id,
      organizationId,
    })

    return { data: toAgentSessionDto(session) }
  }
}

function toAgentSessionDto(entity: AgentSession): AgentSessionDto {
  return {
    id: entity.id,
    agentId: entity.agentId,
    type: entity.type,
    createdAt: entity.createdAt.getTime(),
    updatedAt: entity.updatedAt.getTime(),
  }
}
