process.env.MCP_OAUTH_REDIRECT_URL = "https://app.test/oauth/mcp/callback"

import { BadRequestException } from "@nestjs/common"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  type AllRepositories,
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import type { McpServer } from "../mcp-server.entity"
import { McpServersModule } from "../mcp-servers.module"
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
})
