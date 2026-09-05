import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { AgentMcpServer } from "./agent-mcp-server.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { EncryptionService } from "./encryption.service"
import { McpServer } from "./mcp-server.entity"

export type McpServerConfig = {
  url: string
  apiKey?: string
  /**
   * Static headers sent on every call to this server, for whatever a given
   * server expects beyond its auth (an API version, a tenant). Stored in the
   * encrypted config blob, so adding them needs no migration. The conversation
   * context is applied after them and cannot be overridden here.
   */
  headers?: Record<string, string>
}

export type EnabledMcpServer = McpServerConfig & {
  id: string
}

@Injectable()
export class McpServersService {
  constructor(
    @InjectRepository(McpServer)
    private readonly mcpServerRepository: Repository<McpServer>,
    @InjectRepository(AgentMcpServer)
    private readonly agentMcpServerRepository: Repository<AgentMcpServer>,
    private readonly encryptionService: EncryptionService,
  ) {}

  async getEnabledServersForAgent(agentId: string): Promise<EnabledMcpServer[]> {
    const agentMcpServers = await this.agentMcpServerRepository.find({
      where: { agentId, enabled: true },
      relations: ["mcpServer"],
    })

    return agentMcpServers
      .filter((agentMcpServer) => agentMcpServer.mcpServer)
      .map((agentMcpServer) => ({
        id: agentMcpServer.mcpServer.id,
        ...this.decryptConfig(agentMcpServer.mcpServer),
      }))
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
    const existing = await this.agentMcpServerRepository.findOne({
      where: { agentId, mcpServerId },
    })
    if (existing) {
      if (existing.enabled) return existing
      existing.enabled = true
      return this.agentMcpServerRepository.save(existing)
    }
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

  decryptUrl(mcpServer: McpServer): string {
    return this.decryptConfig(mcpServer).url
  }

  private decryptConfig(mcpServer: McpServer): McpServerConfig {
    const decrypted = this.encryptionService.decrypt(mcpServer.encryptedConfig)
    return JSON.parse(decrypted) as McpServerConfig
  }
}
