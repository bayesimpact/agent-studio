import {
  completeMcpServerOauthSchema,
  createMcpServerSchema,
  type McpServerAuthStatus,
  type McpServerDto,
  McpServersRoutes,
} from "@caseai-connect/api-contracts"
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  UsePipes,
} from "@nestjs/common"
import type {
  EndpointRequestWithMcpServer,
  EndpointRequestWithProject,
} from "@/common/context/request.interface"
import { AddContext, RequireContext } from "@/common/context/require-context.decorator"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { ZodValidationPipe } from "@/common/zod-validation-pipe"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { UserGuard } from "@/domains/users/user.guard"
import type { McpServer } from "./mcp-server.entity"
import { McpServerGuard } from "./mcp-server.guard"
import type { McpServerConfig } from "./mcp-servers.service"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { McpServersService } from "./mcp-servers.service"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { McpOauthService } from "./oauth/mcp-oauth.service"

@UseGuards(JwtAuthGuard, UserGuard, ResourceContextGuard, McpServerGuard)
@RequireContext("organization", "project")
@Controller()
export class McpServersController {
  constructor(
    private readonly mcpServersService: McpServersService,
    private readonly mcpOauthService: McpOauthService,
  ) {}

  @Post(McpServersRoutes.createOne.path)
  @CheckPolicy((policy) => policy.canCreate())
  @UsePipes(new ZodValidationPipe(createMcpServerSchema))
  async createOne(
    @Req() request: EndpointRequestWithProject,
    @Body() { payload }: typeof McpServersRoutes.createOne.request,
  ): Promise<typeof McpServersRoutes.createOne.response> {
    const config = { url: payload.url, apiKey: payload.apiKey, headers: payload.headers }
    const mcpServer = await this.mcpServersService.createMcpServer({
      projectId: request.project.id,
      name: payload.name,
      config,
    })
    return {
      data: toMcpServerDto(mcpServer, config, this.mcpServersService.getAuthStatus(config)),
    }
  }

  @Get(McpServersRoutes.getAll.path)
  @CheckPolicy((policy) => policy.canList())
  async getAll(
    @Req() request: EndpointRequestWithProject,
  ): Promise<typeof McpServersRoutes.getAll.response> {
    const mcpServers = await this.mcpServersService.listMcpServers(request.project.id)
    return {
      data: mcpServers.map((server) => {
        const config = this.mcpServersService.getConfig(server)
        return toMcpServerDto(server, config, this.mcpServersService.getAuthStatus(config))
      }),
    }
  }

  @Delete(McpServersRoutes.deleteOne.path)
  @CheckPolicy((policy) => policy.canDelete())
  @AddContext("mcpServer")
  async deleteOne(
    @Req() request: EndpointRequestWithMcpServer,
  ): Promise<typeof McpServersRoutes.deleteOne.response> {
    await this.mcpServersService.deleteMcpServer(request.mcpServer.id)
    return { data: { success: true } }
  }

  @Post(McpServersRoutes.enableForAgent.path)
  @CheckPolicy((policy) => policy.canCreate())
  @AddContext("mcpServer")
  async enableForAgent(
    @Req() request: EndpointRequestWithMcpServer,
    @Param("agentId") agentId: string,
  ): Promise<typeof McpServersRoutes.enableForAgent.response> {
    await this.mcpServersService.enableForAgent(agentId, request.mcpServer.id)
    return { data: { success: true } }
  }

  @Delete(McpServersRoutes.disableForAgent.path)
  @CheckPolicy((policy) => policy.canDelete())
  @AddContext("mcpServer")
  async disableForAgent(
    @Req() request: EndpointRequestWithMcpServer,
    @Param("agentId") agentId: string,
  ): Promise<typeof McpServersRoutes.disableForAgent.response> {
    await this.mcpServersService.disableForAgent(agentId, request.mcpServer.id)
    return { data: { success: true } }
  }

  @Post(McpServersRoutes.initiateOauth.path)
  @CheckPolicy((policy) => policy.canCreate())
  @AddContext("mcpServer")
  async initiateOauth(
    @Req() request: EndpointRequestWithMcpServer,
  ): Promise<typeof McpServersRoutes.initiateOauth.response> {
    const { authorizationUrl } = await this.mcpOauthService.initiateAuthorization(request.mcpServer)
    return { data: { authorizationUrl } }
  }

  @Post(McpServersRoutes.completeOauth.path)
  @CheckPolicy((policy) => policy.canCreate())
  @AddContext("mcpServer")
  @UsePipes(new ZodValidationPipe(completeMcpServerOauthSchema))
  async completeOauth(
    @Req() request: EndpointRequestWithMcpServer,
    @Body() { payload }: typeof McpServersRoutes.completeOauth.request,
  ): Promise<typeof McpServersRoutes.completeOauth.response> {
    const updated = await this.mcpOauthService.completeAuthorization({
      mcpServer: request.mcpServer,
      code: payload.code,
      state: payload.state,
    })
    const config = this.mcpServersService.getConfig(updated)
    return { data: toMcpServerDto(updated, config, this.mcpServersService.getAuthStatus(config)) }
  }
}

function toMcpServerDto(
  entity: McpServer,
  config: McpServerConfig,
  authStatus: McpServerAuthStatus,
): McpServerDto {
  return {
    id: entity.id,
    name: entity.name,
    url: config.url,
    projectId: entity.projectId!,
    authStatus,
    createdAt: entity.createdAt.getTime(),
    updatedAt: entity.updatedAt.getTime(),
  }
}
