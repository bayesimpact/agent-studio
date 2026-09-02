import { BadRequestException, Injectable, Logger } from "@nestjs/common"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ConfigService } from "@nestjs/config"
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm"
import type { EntityManager, Repository } from "typeorm"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DataSource } from "typeorm"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { EncryptionService } from "../encryption.service"
import { McpServer } from "../mcp-server.entity"
import type { McpServerConfig, McpServerOauthState } from "../mcp-server-config.types"
import { discoverOauthConfiguration, registerOauthClient } from "./mcp-oauth-discovery"
import { isAccessTokenExpired } from "./oauth-tokens"
import { codeChallengeS256, generateCodeVerifier, generateState } from "./pkce"

const PENDING_AUTH_TTL_MS = 10 * 60 * 1000
const TOKEN_REFRESH_MARGIN_MS = 60 * 1000
// The refresh path runs inside a pessimistic row lock (see getValidAccessToken
// below), so a hanging authorization server must not hold that lock forever.
const OAUTH_FETCH_TIMEOUT_MS = 10_000

/**
 * Thrown by `requestTokens`. `isDefinitive` is true only when the authorization
 * server actually responded with a 4xx (e.g. `invalid_grant`) — a definitive
 * rejection of the grant. It is false for network failures and 5xx responses,
 * which are transient and should not cost the caller its stored tokens.
 */
export class OauthTokenRequestError extends BadRequestException {
  constructor(
    message: string,
    readonly isDefinitive: boolean,
  ) {
    super(message)
  }
}

@Injectable()
export class McpOauthService {
  private readonly logger = new Logger(McpOauthService.name)

  constructor(
    @InjectRepository(McpServer)
    private readonly mcpServerRepository: Repository<McpServer>,
    private readonly encryptionService: EncryptionService,
    private readonly configService: ConfigService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
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

  async getValidAccessToken(mcpServerId: string): Promise<string | null> {
    // Row lock: refresh tokens rotate, so two workers must not refresh at once.
    return this.dataSource.transaction(async (manager) => {
      const mcpServer = await manager.getRepository(McpServer).findOne({
        where: { id: mcpServerId },
        lock: { mode: "pessimistic_write" },
      })
      if (!mcpServer) return null
      const config = this.readConfig(mcpServer)
      const oauth = config.oauth
      if (!oauth?.tokens) return null

      if (!isAccessTokenExpired(oauth.tokens, Date.now(), TOKEN_REFRESH_MARGIN_MS)) {
        return oauth.tokens.accessToken
      }
      if (!oauth.tokens.refreshToken) {
        // Expired with no way to refresh: drop the dead tokens so the server reports
        // that it needs re-authorization instead of staying "connected" forever.
        this.logger.warn(
          `MCP OAuth access token expired with no refresh token for server ${mcpServerId}`,
        )
        await this.persistConfigWithManager(manager, mcpServerId, {
          ...config,
          oauth: { ...oauth, tokens: undefined },
        })
        return null
      }

      try {
        const tokens = await this.requestTokens(oauth.tokenEndpoint, {
          grant_type: "refresh_token",
          refresh_token: oauth.tokens.refreshToken,
          client_id: oauth.clientId,
          resource: oauth.resource,
        })
        const mergedTokens = {
          ...tokens,
          refreshToken: tokens.refreshToken ?? oauth.tokens.refreshToken,
        }
        await this.persistConfigWithManager(manager, mcpServerId, {
          ...config,
          oauth: { ...oauth, tokens: mergedTokens },
        })
        return mergedTokens.accessToken
      } catch (error) {
        this.logger.warn(
          `MCP OAuth refresh failed for server ${mcpServerId}: ${error instanceof Error ? error.message : error}`,
        )
        const isDefinitive = error instanceof OauthTokenRequestError && error.isDefinitive
        if (isDefinitive) {
          // Definitive rejection (e.g. invalid_grant): drop the tokens so the UI shows
          // the server needs re-authorization.
          await this.persistConfigWithManager(manager, mcpServerId, {
            ...config,
            oauth: { ...oauth, tokens: undefined },
          })
        }
        // Transient failure (network error, 5xx): keep the stored tokens untouched so
        // the next connection attempt can retry the refresh.
        return null
      }
    })
  }

  private async requestTokens(
    tokenEndpoint: string,
    params: Record<string, string>,
  ): Promise<NonNullable<McpServerOauthState["tokens"]>> {
    let response: Response
    try {
      response = await fetch(tokenEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(params).toString(),
        redirect: "manual",
        signal: AbortSignal.timeout(OAUTH_FETCH_TIMEOUT_MS),
      })
    } catch (error) {
      this.logger.warn(`MCP OAuth token request failed: ${(error as Error).message}`)
      throw new OauthTokenRequestError("OAuth token request failed (network error).", false)
    }
    const body = (await response.json().catch(() => ({}))) as {
      access_token?: string
      refresh_token?: string
      expires_in?: number
      error?: string
    }
    if (!response.ok || !body.access_token) {
      this.logger.warn(`MCP OAuth token request failed: ${response.status} ${body.error ?? ""}`)
      const isDefinitive = response.status >= 400 && response.status < 500
      throw new OauthTokenRequestError(
        `OAuth token request failed (${body.error ?? response.status}).`,
        isDefinitive,
      )
    }
    return {
      accessToken: body.access_token,
      refreshToken: body.refresh_token,
      expiresAt: body.expires_in === undefined ? undefined : Date.now() + body.expires_in * 1000,
    }
  }

  private readConfig(mcpServer: McpServer): McpServerConfig {
    return JSON.parse(this.encryptionService.decrypt(mcpServer.encryptedConfig)) as McpServerConfig
  }

  private async saveConfig(mcpServerId: string, config: McpServerConfig): Promise<void> {
    await this.persistConfigWithManager(this.dataSource.manager, mcpServerId, config)
  }

  private async persistConfigWithManager(
    manager: EntityManager,
    mcpServerId: string,
    config: McpServerConfig,
  ): Promise<void> {
    await manager
      .getRepository(McpServer)
      .update(
        { id: mcpServerId },
        { encryptedConfig: this.encryptionService.encrypt(JSON.stringify(config)) },
      )
  }
}
