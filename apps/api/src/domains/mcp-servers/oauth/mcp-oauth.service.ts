import { BadRequestException, Injectable, Logger } from "@nestjs/common"
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
  private readonly logger = new Logger(McpOauthService.name)

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

  async completeAuthorization({
    mcpServer,
    code,
    state,
  }: {
    mcpServer: McpServer
    code: string
    state: string
  }): Promise<McpServer> {
    const config = this.readConfig(mcpServer)
    const pendingAuth = config.oauth?.pendingAuth
    if (!config.oauth || !pendingAuth) {
      throw new BadRequestException("No pending OAuth authorization for this MCP server.")
    }
    if (pendingAuth.state !== state) {
      throw new BadRequestException("OAuth state mismatch.")
    }
    if (pendingAuth.expiresAt < Date.now()) {
      throw new BadRequestException("The OAuth authorization expired. Start again.")
    }

    const tokens = await this.requestTokens(config.oauth.tokenEndpoint, {
      grant_type: "authorization_code",
      code,
      redirect_uri: pendingAuth.redirectUri,
      client_id: config.oauth.clientId,
      code_verifier: pendingAuth.codeVerifier,
      resource: config.oauth.resource,
    })

    const { pendingAuth: _discarded, ...oauthRest } = config.oauth
    await this.saveConfig(mcpServer.id, { ...config, oauth: { ...oauthRest, tokens } })
    return this.mcpServerRepository.findOneByOrFail({ id: mcpServer.id })
  }

  private async requestTokens(
    tokenEndpoint: string,
    params: Record<string, string>,
  ): Promise<NonNullable<McpServerOauthState["tokens"]>> {
    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params).toString(),
    })
    const body = (await response.json().catch(() => ({}))) as {
      access_token?: string
      refresh_token?: string
      expires_in?: number
      error?: string
    }
    if (!response.ok || !body.access_token) {
      this.logger.warn(`MCP OAuth token request failed: ${response.status} ${body.error ?? ""}`)
      throw new BadRequestException(
        `OAuth token request failed (${body.error ?? response.status}).`,
      )
    }
    return {
      accessToken: body.access_token,
      refreshToken: body.refresh_token,
      expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000,
    }
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
