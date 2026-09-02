process.env.MCP_OAUTH_REDIRECT_URL = "https://app.test/oauth/mcp/callback"

import { BadRequestException } from "@nestjs/common"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  type AllRepositories,
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { agentFactory } from "@/domains/agents/agent.factory"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import { EncryptionService } from "../encryption.service"
import type { McpServer } from "../mcp-server.entity"
import { McpServersModule } from "../mcp-servers.module"
import type { McpServerOauthState, McpServerOauthTokens } from "../mcp-servers.service"
import { McpServersService } from "../mcp-servers.service"
import { McpOauthService } from "./mcp-oauth.service"

global.fetch = jest.fn()
const fetchMock = global.fetch as jest.Mock

const MCP_URL = "https://mcp.example.com/mcp"

const resourceMetadata = {
  resource: "https://mcp.example.com",
  authorization_servers: ["https://auth.example.com"],
  scopes_supported: ["mcp.tools", "offline_access"],
}

const authServerMetadata = {
  issuer: "https://auth.example.com",
  authorization_endpoint: "https://auth.example.com/oauth2/authorize",
  token_endpoint: "https://auth.example.com/oauth2/token",
  registration_endpoint: "https://auth.example.com/connect/register",
  code_challenge_methods_supported: ["S256"],
}

const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })

const unauthorizedProbe = () =>
  new Response(null, {
    status: 401,
    headers: {
      "WWW-Authenticate":
        'Bearer resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource/mcp"',
    },
  })

const mockFullDiscoveryAndRegistration = () => {
  fetchMock
    .mockResolvedValueOnce(unauthorizedProbe())
    .mockResolvedValueOnce(json(resourceMetadata))
    .mockResolvedValueOnce(json(authServerMetadata))
    .mockResolvedValueOnce(json({ client_id: "client-123" }))
}

const mockDiscoveryOnly = (metadata: Record<string, unknown>) => {
  fetchMock
    .mockResolvedValueOnce(unauthorizedProbe())
    .mockResolvedValueOnce(json(resourceMetadata))
    .mockResolvedValueOnce(json(metadata))
}

describe("McpOauthService", () => {
  let mcpOauthService: McpOauthService
  let mcpServersService: McpServersService
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: AllRepositories

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [McpServersModule],
    })
    await clearTestDatabase(setup.dataSource)
    repositories = setup.getAllRepositories()
    mcpOauthService = setup.module.get<McpOauthService>(McpOauthService)
    mcpServersService = setup.module.get<McpServersService>(McpServersService)
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
  })

  afterEach(async () => {
    await clearTestDatabase(setup.dataSource)
  })

  beforeEach(() => {
    fetchMock.mockReset()
  })

  const createServer = async (overrides: { url: string }): Promise<McpServer> => {
    const { project } = await createOrganizationWithProject(repositories)
    return mcpServersService.createMcpServer({
      projectId: project.id,
      name: "Test MCP Server",
      config: { url: overrides.url },
    })
  }

  const initiateForServer = async (): Promise<{
    mcpServer: McpServer
    state: string
    codeVerifier: string
  }> => {
    mockFullDiscoveryAndRegistration()
    const created = await createServer({ url: MCP_URL })

    const { authorizationUrl } = await mcpOauthService.initiateAuthorization(created)
    const state = new URL(authorizationUrl).searchParams.get("state")
    if (!state) throw new Error("Expected a state param on the authorization URL")

    const reloaded = await repositories.mcpServerRepository.findOneByOrFail({ id: created.id })
    const config = mcpServersService.getConfig(reloaded)
    const codeVerifier = config.oauth?.pendingAuth?.codeVerifier
    if (!codeVerifier) throw new Error("Expected a pending codeVerifier after initiation")

    return { mcpServer: reloaded, state, codeVerifier }
  }

  const TOKEN_ENDPOINT = "https://auth.example.com/oauth2/token"

  const seedServerWithOauth = async (
    tokens: McpServerOauthTokens | undefined,
    overrides: Partial<McpServerOauthState> = {},
  ): Promise<McpServer> => {
    const mcpServer = await createServer({ url: MCP_URL })
    const config = mcpServersService.getConfig(mcpServer)
    const oauth: McpServerOauthState = {
      clientId: "client-123",
      authorizationEndpoint: "https://auth.example.com/oauth2/authorize",
      tokenEndpoint: TOKEN_ENDPOINT,
      resource: "https://mcp.example.com",
      tokens,
      ...overrides,
    }
    await repositories.mcpServerRepository.update(
      { id: mcpServer.id },
      {
        encryptedConfig: setup.module
          .get(EncryptionService)
          .encrypt(JSON.stringify({ ...config, oauth })),
      },
    )
    return repositories.mcpServerRepository.findOneByOrFail({ id: mcpServer.id })
  }

  it("stores oauth state and returns the authorization URL with PKCE, state, resource and scope", async () => {
    mockFullDiscoveryAndRegistration()
    const mcpServer = await createServer({ url: MCP_URL })

    const { authorizationUrl } = await mcpOauthService.initiateAuthorization(mcpServer)

    const url = new URL(authorizationUrl)
    expect(url.origin + url.pathname).toBe("https://auth.example.com/oauth2/authorize")
    expect(url.searchParams.get("response_type")).toBe("code")
    expect(url.searchParams.get("client_id")).toBe("client-123")
    expect(url.searchParams.get("redirect_uri")).toBe("https://app.test/oauth/mcp/callback")
    expect(url.searchParams.get("code_challenge_method")).toBe("S256")
    expect(url.searchParams.get("code_challenge")).toBeTruthy()
    expect(url.searchParams.get("state")).toBeTruthy()
    expect(url.searchParams.get("resource")).toBe("https://mcp.example.com")
    expect(url.searchParams.get("scope")).toBe("mcp.tools offline_access")

    const reloaded = await repositories.mcpServerRepository.findOneByOrFail({ id: mcpServer.id })
    const config = mcpServersService.getConfig(reloaded)
    expect(config.oauth?.clientId).toBe("client-123")
    expect(config.oauth?.pendingAuth?.state).toBe(url.searchParams.get("state"))
    expect(config.oauth?.pendingAuth?.codeVerifier).toBeTruthy()
    expect(config.oauth?.pendingAuth?.expiresAt).toBeGreaterThan(Date.now())
  })

  it("reuses the already-registered client on a second initiation", async () => {
    mockFullDiscoveryAndRegistration()
    const mcpServer = await createServer({ url: MCP_URL })

    const first = await mcpOauthService.initiateAuthorization(mcpServer)
    const firstClientId = new URL(first.authorizationUrl).searchParams.get("client_id")
    expect(fetchMock).toHaveBeenCalledTimes(4)

    mockDiscoveryOnly(authServerMetadata)
    const reloaded = await repositories.mcpServerRepository.findOneByOrFail({ id: mcpServer.id })
    const second = await mcpOauthService.initiateAuthorization(reloaded)
    const secondClientId = new URL(second.authorizationUrl).searchParams.get("client_id")

    expect(secondClientId).toBe(firstClientId)
    expect(fetchMock).toHaveBeenCalledTimes(7)
    const registrationCalls = fetchMock.mock.calls.filter(
      ([url]) => url === "https://auth.example.com/connect/register",
    )
    expect(registrationCalls).toHaveLength(1)
  })

  it("throws BadRequestException when the server advertises no OAuth metadata", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
    const mcpServer = await createServer({ url: MCP_URL })

    await expect(mcpOauthService.initiateAuthorization(mcpServer)).rejects.toThrow(
      BadRequestException,
    )
  })

  it("throws BadRequestException when there is no registration endpoint and no stored client", async () => {
    const { registration_endpoint: _registrationEndpoint, ...metadataWithoutRegistration } =
      authServerMetadata
    mockDiscoveryOnly(metadataWithoutRegistration)
    const mcpServer = await createServer({ url: MCP_URL })

    await expect(mcpOauthService.initiateAuthorization(mcpServer)).rejects.toThrow(
      BadRequestException,
    )
  })

  it("exchanges the code with the PKCE verifier and stores the tokens", async () => {
    const { mcpServer, state, codeVerifier } = await initiateForServer()
    fetchMock.mockResolvedValueOnce(
      json({ access_token: "at-1", refresh_token: "rt-1", expires_in: 3600, token_type: "Bearer" }),
    )

    const updated = await mcpOauthService.completeAuthorization({
      mcpServer,
      code: "code-1",
      state,
    })

    const [tokenUrl, init] = fetchMock.mock.calls.at(-1)!
    expect(tokenUrl).toBe("https://auth.example.com/oauth2/token")
    const body = new URLSearchParams(init.body)
    expect(body.get("grant_type")).toBe("authorization_code")
    expect(body.get("code")).toBe("code-1")
    expect(body.get("code_verifier")).toBe(codeVerifier)
    expect(body.get("client_id")).toBe("client-123")
    expect(body.get("redirect_uri")).toBe("https://app.test/oauth/mcp/callback")
    expect(body.get("resource")).toBe("https://mcp.example.com")

    const config = mcpServersService.getConfig(updated)
    expect(config.oauth?.tokens?.accessToken).toBe("at-1")
    expect(config.oauth?.tokens?.refreshToken).toBe("rt-1")
    expect(config.oauth?.tokens?.expiresAt).toBeGreaterThan(Date.now())
    expect(config.oauth?.pendingAuth).toBeUndefined()
  })

  it("rejects a mismatched state", async () => {
    const { mcpServer } = await initiateForServer()
    await expect(
      mcpOauthService.completeAuthorization({ mcpServer, code: "code-1", state: "wrong" }),
    ).rejects.toThrow(BadRequestException)
  })

  it("rejects an expired pending authorization", async () => {
    const { mcpServer, state } = await initiateForServer()
    const config = mcpServersService.getConfig(mcpServer)
    const expiredConfig = {
      ...config,
      oauth: {
        ...config.oauth,
        pendingAuth: {
          ...config.oauth?.pendingAuth,
          expiresAt: Date.now() - 1000,
        },
      },
    }
    await repositories.mcpServerRepository.update(
      { id: mcpServer.id },
      {
        encryptedConfig: setup.module.get(EncryptionService).encrypt(JSON.stringify(expiredConfig)),
      },
    )
    const reloaded = await repositories.mcpServerRepository.findOneByOrFail({ id: mcpServer.id })

    await expect(
      mcpOauthService.completeAuthorization({ mcpServer: reloaded, code: "code-1", state }),
    ).rejects.toThrow(BadRequestException)
  })

  it("rejects when there is no pending authorization", async () => {
    const mcpServer = await createServer({ url: "https://mcp.example.com/mcp" })
    await expect(
      mcpOauthService.completeAuthorization({ mcpServer, code: "c", state: "s" }),
    ).rejects.toThrow(BadRequestException)
  })

  it("surfaces a token endpoint error as BadRequestException", async () => {
    const { mcpServer, state } = await initiateForServer()
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 }),
    )
    await expect(
      mcpOauthService.completeAuthorization({ mcpServer, code: "bad", state }),
    ).rejects.toThrow(BadRequestException)
  })

  it("surfaces a network error from the token endpoint as BadRequestException", async () => {
    const { mcpServer, state } = await initiateForServer()
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"))
    await expect(
      mcpOauthService.completeAuthorization({ mcpServer, code: "code-1", state }),
    ).rejects.toThrow(BadRequestException)
  })

  describe("getValidAccessToken", () => {
    it("returns the stored token while it is fresh", async () => {
      const mcpServer = await seedServerWithOauth({
        accessToken: "at-1",
        expiresAt: Date.now() + 3600_000,
      })

      const token = await mcpOauthService.getValidAccessToken(mcpServer.id)

      expect(token).toBe("at-1")
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it("refreshes an expired token, persists the rotated refresh token, and returns the new one", async () => {
      const mcpServer = await seedServerWithOauth({
        accessToken: "old",
        refreshToken: "rt-1",
        expiresAt: Date.now() - 1000,
      })
      fetchMock.mockResolvedValueOnce(
        json({ access_token: "at-2", refresh_token: "rt-2", expires_in: 3600 }),
      )

      const token = await mcpOauthService.getValidAccessToken(mcpServer.id)

      expect(token).toBe("at-2")
      const [tokenUrl, init] = fetchMock.mock.calls.at(-1)!
      expect(tokenUrl).toBe(TOKEN_ENDPOINT)
      const body = new URLSearchParams(init.body)
      expect(body.get("grant_type")).toBe("refresh_token")
      expect(body.get("refresh_token")).toBe("rt-1")
      expect(body.get("client_id")).toBe("client-123")
      expect(body.get("resource")).toBe("https://mcp.example.com")

      const reloaded = await repositories.mcpServerRepository.findOneByOrFail({ id: mcpServer.id })
      const config = mcpServersService.getConfig(reloaded)
      expect(config.oauth?.tokens?.accessToken).toBe("at-2")
      expect(config.oauth?.tokens?.refreshToken).toBe("rt-2")
    })

    it("keeps the previous refresh token when the response does not rotate it", async () => {
      const mcpServer = await seedServerWithOauth({
        accessToken: "old",
        refreshToken: "rt-1",
        expiresAt: Date.now() - 1000,
      })
      fetchMock.mockResolvedValueOnce(json({ access_token: "at-2", expires_in: 3600 }))

      const token = await mcpOauthService.getValidAccessToken(mcpServer.id)

      expect(token).toBe("at-2")
      const reloaded = await repositories.mcpServerRepository.findOneByOrFail({ id: mcpServer.id })
      const config = mcpServersService.getConfig(reloaded)
      expect(config.oauth?.tokens?.refreshToken).toBe("rt-1")
    })

    it("clears tokens and returns null when the refresh is rejected", async () => {
      const mcpServer = await seedServerWithOauth({
        accessToken: "old",
        refreshToken: "rt-1",
        expiresAt: Date.now() - 1000,
      })
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 }),
      )

      const token = await mcpOauthService.getValidAccessToken(mcpServer.id)

      expect(token).toBeNull()
      const reloaded = await repositories.mcpServerRepository.findOneByOrFail({ id: mcpServer.id })
      const config = mcpServersService.getConfig(reloaded)
      expect(config.oauth?.tokens).toBeUndefined()
      expect(mcpServersService.getAuthStatus(config)).toBe("oauthPending")
    })

    it("returns null for a server without oauth tokens", async () => {
      const mcpServer = await createServer({ url: MCP_URL })

      const token = await mcpOauthService.getValidAccessToken(mcpServer.id)

      expect(token).toBeNull()
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  describe("McpServersService.getEnabledServersForAgent with an oauth-configured server", () => {
    it("swaps in the refreshed access token as apiKey", async () => {
      const { organization, project } = await createOrganizationWithProject(repositories)
      const agent = agentFactory.transient({ organization, project }).build()
      await repositories.agentRepository.save(agent)

      const mcpServer = await seedServerWithOauth({
        accessToken: "old",
        refreshToken: "rt-1",
        expiresAt: Date.now() - 1000,
      })
      await mcpServersService.enableForAgent(agent.id, mcpServer.id)
      fetchMock.mockResolvedValueOnce(
        json({ access_token: "at-2", refresh_token: "rt-2", expires_in: 3600 }),
      )

      const servers = await mcpServersService.getEnabledServersForAgent(agent.id)

      expect(servers).toHaveLength(1)
      expect(servers[0]?.apiKey).toBe("at-2")
    })
  })
})
