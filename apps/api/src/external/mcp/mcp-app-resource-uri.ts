const LEGACY_RESOURCE_URI_META_KEY = "ui/resourceUri"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

/**
 * Reads the MCP App UI resource URI from a tool definition.
 * Prefers `_meta.ui.resourceUri`, then the legacy `_meta["ui/resourceUri"]`.
 * Invalid or non-`ui://` values are ignored so a malformed tool cannot break the chat.
 */
export function getMcpAppResourceUri(tool: unknown): string | undefined {
  if (!isRecord(tool) || !isRecord(tool._meta)) return undefined

  const nestedUi = isRecord(tool._meta.ui) ? tool._meta.ui.resourceUri : undefined
  const legacyUri = tool._meta[LEGACY_RESOURCE_URI_META_KEY]
  const resourceUri = typeof nestedUi === "string" ? nestedUi : legacyUri

  if (typeof resourceUri !== "string" || !resourceUri.startsWith("ui://")) return undefined
  return resourceUri
}
