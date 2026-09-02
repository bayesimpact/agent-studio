import type { McpServerAuthStatus } from "@caseai-connect/api-contracts"
import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { AgentMcpServer } from "./agent-mcp-server.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { EncryptionService } from "./encryption.service"
import { McpServer } from "./mcp-server.entity"
import type { EnabledMcpServer, McpServerConfig } from "./mcp-server-config.types"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { McpOauthService } from "./oauth/mcp-oauth.service"

export type {
  EnabledMcpServer,
  McpServerConfig,
  McpServerOauthPendingAuth,
  McpServerOauthState,
  McpServerOauthTokens,
} from "./mcp-server-config.types"

@Injectable()
export class McpServersService {
  constructor(
    @InjectRepository(McpServer)
    private readonly mcpServerRepository: Repository<McpServer>,
    @InjectRepository(AgentMcpServer)
    private readonly agentMcpServerRepository: Repository<AgentMcpServer>,
    private readonly encryptionService: EncryptionService,
    private readonly mcpOauthService: McpOauthService,
  ) {}

  async getEnabledServersForAgent(agentId: string): Promise<EnabledMcpServer[]> {
    const agentMcpServers = await this.agentMcpServerRepository.find({
      where: { agentId, enabled: true },
      relations: ["mcpServer"],
    })

    const enabledServers = agentMcpServers.filter((agentMcpServer) => agentMcpServer.mcpServer)
    return Promise.all(
      enabledServers.map(async (agentMcpServer) => {
        const { oauth, ...config } = this.decryptConfig(agentMcpServer.mcpServer)
        if (!oauth) return { id: agentMcpServer.mcpServer.id, ...config }
        const accessToken = await this.mcpOauthService.getValidAccessToken(
          agentMcpServer.mcpServer.id,
        )
        return { id: agentMcpServer.mcpServer.id, ...config, apiKey: accessToken ?? undefined }
      }),
    )
  }

  async createPreset(slug: string, name: string, config: McpServerConfig): Promise<McpServer> {
    const encryptedConfig = this.encryptionService.encrypt(JSON.stringify(config))
    return this.mcpServerRepository.save(
      this.mcpServerRepository.create({
        name,
        presetSlug: slug,
        projectId: null,
        encryptedConfig,
      }),
    )
  }

  async createMcpServer({
    projectId,
    name,
    config,
  }: {
    projectId: string
    name: string
    config: McpServerConfig
  }): Promise<McpServer> {
    const encryptedConfig = this.encryptionService.encrypt(JSON.stringify(config))
    return this.mcpServerRepository.save(
      this.mcpServerRepository.create({
        name,
        presetSlug: null,
        projectId,
        encryptedConfig,
      }),
    )
  }

  async listMcpServers(projectId: string): Promise<McpServer[]> {
    return this.mcpServerRepository.find({
      where: { projectId },
      order: { name: "ASC" },
    })
  }

  async findMcpServerById(mcpServerId: string, projectId: string): Promise<McpServer | null> {
    return this.mcpServerRepository.findOne({
      where: { id: mcpServerId, projectId },
    })
  }

  async deleteMcpServer(mcpServerId: string): Promise<void> {
    await this.agentMcpServerRepository.softDelete({ mcpServerId })
    await this.mcpServerRepository.softDelete({ id: mcpServerId })
  }

  async enableForAgent(agentId: string, mcpServerId: string): Promise<AgentMcpServer> {
    return this.agentMcpServerRepository.save(
      this.agentMcpServerRepository.create({
        agentId,
        mcpServerId,
        enabled: true,
      }),
    )
  }

  async disableForAgent(agentId: string, mcpServerId: string): Promise<void> {
    await this.agentMcpServerRepository.delete({ agentId, mcpServerId })
  }

  getConfig(mcpServer: McpServer): McpServerConfig {
    return this.decryptConfig(mcpServer)
  }

  getAuthStatus(config: McpServerConfig): McpServerAuthStatus {
    if (config.oauth?.tokens) return "oauthConnected"
    if (config.oauth || config.authMethod === "oauth") return "oauthPending"
    if (config.apiKey) return "apiKey"
    return "none"
  }

  private decryptConfig(mcpServer: McpServer): McpServerConfig {
    const decrypted = this.encryptionService.decrypt(mcpServer.encryptedConfig)
    return JSON.parse(decrypted) as McpServerConfig
  }
}
