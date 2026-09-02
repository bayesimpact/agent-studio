import { BadRequestException, Injectable } from "@nestjs/common"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ConfigService } from "@nestjs/config"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { EncryptionService } from "../encryption.service"
import { McpServer } from "../mcp-server.entity"
import type { McpServerConfig, McpServerOauthState } from "../mcp-servers.service"
import { discoverOauthConfiguration, registerOauthClient } from "./mcp-oauth-discovery"
import { codeChallengeS256, generateCodeVerifier, generateState } from "./pkce"

const PENDING_AUTH_TTL_MS = 10 * 60 * 1000

@Injectable()
export class McpOauthService {
  constructor(
    @InjectRepository(McpServer)
    private readonly mcpServerRepository: Repository<McpServer>,
    private readonly encryptionService: EncryptionService,
    private readonly configService: ConfigService,
  ) {}

  async initiateAuthorization(mcpServer: McpServer): Promise<{ authorizationUrl: string }> {
    const config = this.readConfig(mcpServer)
    const redirectUri = this.configService.getOrThrow<string>("MCP_OAUTH_REDIRECT_URL")

    const discovery = await discoverOauthConfiguration(config.url)
    if (!discovery) {
      throw new BadRequestException(
        "This MCP server does not advertise OAuth authorization. Use an API key instead.",
      )
    }

    let clientId = config.oauth?.clientId
    if (!clientId) {
      if (!discovery.registrationEndpoint) {
        throw new BadRequestException(
          "This MCP server's authorization server does not support dynamic client registration.",
        )
      }
      clientId = await registerOauthClient({
        registrationEndpoint: discovery.registrationEndpoint,
        redirectUri,
      })
    }

    const codeVerifier = generateCodeVerifier()
    const state = generateState()
    const scope = discovery.scopesSupported?.join(" ")

    const oauth: McpServerOauthState = {
      clientId,
      authorizationEndpoint: discovery.authorizationEndpoint,
      tokenEndpoint: discovery.tokenEndpoint,
      resource: discovery.resource,
      scope,
      tokens: config.oauth?.tokens,
      pendingAuth: {
        state,
        codeVerifier,
        redirectUri,
        expiresAt: Date.now() + PENDING_AUTH_TTL_MS,
      },
    }
    await this.saveConfig(mcpServer.id, { ...config, oauth })

    const authorizationUrl = new URL(discovery.authorizationEndpoint)
    authorizationUrl.searchParams.set("response_type", "code")
    authorizationUrl.searchParams.set("client_id", clientId)
    authorizationUrl.searchParams.set("redirect_uri", redirectUri)
    authorizationUrl.searchParams.set("state", state)
    authorizationUrl.searchParams.set("code_challenge", codeChallengeS256(codeVerifier))
    authorizationUrl.searchParams.set("code_challenge_method", "S256")
    authorizationUrl.searchParams.set("resource", discovery.resource)
    if (scope) authorizationUrl.searchParams.set("scope", scope)

    return { authorizationUrl: authorizationUrl.toString() }
  }

  private readConfig(mcpServer: McpServer): McpServerConfig {
    return JSON.parse(this.encryptionService.decrypt(mcpServer.encryptedConfig)) as McpServerConfig
  }

  private async saveConfig(mcpServerId: string, config: McpServerConfig): Promise<void> {
    await this.mcpServerRepository.update(
      { id: mcpServerId },
      { encryptedConfig: this.encryptionService.encrypt(JSON.stringify(config)) },
    )
  }
}
