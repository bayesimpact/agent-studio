import { discoverOauthConfiguration, registerOauthClient } from "./mcp-oauth-discovery"

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

describe("discoverOauthConfiguration", () => {
  beforeEach(() => fetchMock.mockReset())

  it("follows WWW-Authenticate resource_metadata from a 401 probe", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(null, {
          status: 401,
          headers: {
            "WWW-Authenticate":
              'Bearer resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource/mcp"',
          },
        }),
      )
      .mockResolvedValueOnce(json(resourceMetadata))
      .mockResolvedValueOnce(json(authServerMetadata))

    const discovery = await discoverOauthConfiguration(MCP_URL)

    expect(discovery).toEqual({
      authorizationEndpoint: "https://auth.example.com/oauth2/authorize",
      tokenEndpoint: "https://auth.example.com/oauth2/token",
      registrationEndpoint: "https://auth.example.com/connect/register",
      resource: "https://mcp.example.com",
      scopesSupported: ["mcp.tools", "offline_access"],
    })
    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://mcp.example.com/.well-known/oauth-protected-resource/mcp",
    )
  })

  it("falls back to the path-derived well-known URL when the probe has no WWW-Authenticate", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(json(resourceMetadata))
      .mockResolvedValueOnce(json(authServerMetadata))

    const discovery = await discoverOauthConfiguration(MCP_URL)

    expect(discovery?.tokenEndpoint).toBe("https://auth.example.com/oauth2/token")
    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://mcp.example.com/.well-known/oauth-protected-resource/mcp",
    )
  })

  it("returns null when the server advertises no OAuth metadata", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))

    expect(await discoverOauthConfiguration(MCP_URL)).toBeNull()
  })

  it("tries openid-configuration when oauth-authorization-server metadata is missing", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(json(resourceMetadata))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(json(authServerMetadata))

    const discovery = await discoverOauthConfiguration(MCP_URL)

    expect(discovery?.authorizationEndpoint).toBe("https://auth.example.com/oauth2/authorize")
    expect(fetchMock.mock.calls[3][0]).toBe(
      "https://auth.example.com/.well-known/openid-configuration",
    )
  })
})

describe("registerOauthClient", () => {
  beforeEach(() => fetchMock.mockReset())

  it("registers a public client and returns its client_id", async () => {
    fetchMock.mockResolvedValueOnce(json({ client_id: "client-123" }))

    const clientId = await registerOauthClient({
      registrationEndpoint: "https://auth.example.com/connect/register",
      redirectUri: "https://app.example.com/oauth/mcp/callback",
    })

    expect(clientId).toBe("client-123")
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("https://auth.example.com/connect/register")
    expect(JSON.parse(init.body)).toMatchObject({
      redirect_uris: ["https://app.example.com/oauth/mcp/callback"],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    })
  })

  it("throws when registration fails", async () => {
    fetchMock.mockResolvedValueOnce(new Response("nope", { status: 400 }))

    await expect(
      registerOauthClient({
        registrationEndpoint: "https://auth.example.com/connect/register",
        redirectUri: "https://app.example.com/oauth/mcp/callback",
      }),
    ).rejects.toThrow()
  })
})
