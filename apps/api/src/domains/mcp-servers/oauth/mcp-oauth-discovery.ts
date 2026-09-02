/**
 * OAuth discovery for MCP servers, per the MCP Authorization spec:
 * RFC 9728 (protected resource metadata), RFC 8414 (authorization server
 * metadata) and RFC 7591 (dynamic client registration). Pure functions over
 * global fetch so they can be unit-tested without Nest.
 */

export type McpOauthDiscovery = {
  authorizationEndpoint: string
  tokenEndpoint: string
  registrationEndpoint?: string
  /** Canonical resource URI (RFC 8707), from the protected resource metadata. */
  resource: string
  scopesSupported?: string[]
}

type ProtectedResourceMetadata = {
  resource?: string
  authorization_servers?: string[]
  scopes_supported?: string[]
}

type AuthorizationServerMetadata = {
  authorization_endpoint?: string
  token_endpoint?: string
  registration_endpoint?: string
}

export async function discoverOauthConfiguration(
  mcpUrl: string,
): Promise<McpOauthDiscovery | null> {
  const resourceMetadataUrl = await probeForResourceMetadataUrl(mcpUrl)
  const resourceMetadata = await fetchJson<ProtectedResourceMetadata>(resourceMetadataUrl)
  if (!resourceMetadata?.authorization_servers?.length) return null

  const issuer = (resourceMetadata.authorization_servers as string[])[0]!.replace(/\/$/, "")
  const serverMetadata =
    (await fetchJson<AuthorizationServerMetadata>(
      `${issuer}/.well-known/oauth-authorization-server`,
    )) ??
    (await fetchJson<AuthorizationServerMetadata>(`${issuer}/.well-known/openid-configuration`))
  if (!serverMetadata?.authorization_endpoint || !serverMetadata.token_endpoint) return null

  return {
    authorizationEndpoint: serverMetadata.authorization_endpoint,
    tokenEndpoint: serverMetadata.token_endpoint,
    registrationEndpoint: serverMetadata.registration_endpoint,
    resource: resourceMetadata.resource ?? mcpUrl,
    scopesSupported: resourceMetadata.scopes_supported,
  }
}

export async function registerOauthClient({
  registrationEndpoint,
  redirectUri,
}: {
  registrationEndpoint: string
  redirectUri: string
}): Promise<string> {
  const response = await fetch(registrationEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: "Bayes Platform",
      redirect_uris: [redirectUri],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    }),
  })
  if (!response.ok) {
    throw new Error(`Dynamic client registration failed with status ${response.status}`)
  }
  const body = (await response.json()) as { client_id?: string }
  if (!body.client_id) throw new Error("Dynamic client registration returned no client_id")
  return body.client_id
}

/**
 * Probes the MCP endpoint expecting a 401 whose WWW-Authenticate names the
 * resource metadata URL. Falls back to the RFC 9728 path-derived well-known
 * URL when the header is absent or the probe itself fails.
 */
async function probeForResourceMetadataUrl(mcpUrl: string): Promise<string> {
  try {
    const probe = await fetch(mcpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 0, method: "ping" }),
    })
    const wwwAuthenticate = probe.headers.get("www-authenticate")
    if (wwwAuthenticate) {
      const match = wwwAuthenticate.match(/resource_metadata="([^"]+)"/)
      if (match?.[1]) return match[1]
    }
  } catch {
    // Network errors fall through to the well-known fallback.
  }
  const url = new URL(mcpUrl)
  const path: string = url.pathname === "/" ? "" : (url.pathname ?? "")
  return `${url.origin}/.well-known/oauth-protected-resource${path}`
}

async function fetchJson<ResponseBody>(url: string): Promise<ResponseBody | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    return (await response.json()) as ResponseBody
  } catch {
    return null
  }
}
