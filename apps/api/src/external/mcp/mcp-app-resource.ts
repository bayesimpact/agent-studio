export const MCP_APP_MIME_TYPE = "text/html;profile=mcp-app"

export type McpResourceReadResult = {
  contents?: Array<{
    uri?: string
    mimeType?: string
    text?: string
    blob?: string
  }>
}

export class McpAppResourceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "McpAppResourceError"
  }
}

function isMcpAppMimeType(mimeType: string | undefined): boolean {
  if (!mimeType) return false
  const normalized = mimeType.toLowerCase().replaceAll(/\s+/g, "")
  return normalized === MCP_APP_MIME_TYPE || normalized.startsWith(`${MCP_APP_MIME_TYPE};`)
}

function decodeHtml(content: { text?: string; blob?: string }): string | undefined {
  if (typeof content.text === "string") return content.text
  if (typeof content.blob === "string") {
    return Buffer.from(content.blob, "base64").toString("utf8")
  }
  return undefined
}

/**
 * Validates a `resources/read` result and returns the MCP App HTML.
 * Only `ui://` URIs with `text/html;profile=mcp-app` are accepted.
 */
export function readMcpAppHtml({
  resourceUri,
  resource,
}: {
  resourceUri: string
  resource: McpResourceReadResult
}): string {
  if (!resourceUri.startsWith("ui://")) {
    throw new McpAppResourceError(`Unsupported MCP App resource URI: ${resourceUri}`)
  }

  const contents = resource.contents ?? []
  const content =
    contents.find((entry) => entry.uri === resourceUri) ??
    (contents.length === 1 ? contents[0] : undefined)

  if (!content) {
    throw new McpAppResourceError(`MCP App resource not found: ${resourceUri}`)
  }

  if (!isMcpAppMimeType(content.mimeType)) {
    throw new McpAppResourceError(
      `Unsupported MCP App resource MIME type: ${content.mimeType ?? "missing"}`,
    )
  }

  const html = decodeHtml(content)
  if (html == null || html.trim().length === 0) {
    throw new McpAppResourceError(`Malformed MCP App resource: ${resourceUri}`)
  }

  return html
}
