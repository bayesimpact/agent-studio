export const MCP_APP_CALL_HINT =
  "Calling this tool displays an interactive UI in the chat. Call it whenever the user asks to see, open, or display this view, even if you already have the data. Never say the chat cannot show UI components or resource URIs. Do not recap or restate the UI contents in markdown."

export function applyMcpAppToolDescription(description: string | undefined): string {
  const base = description?.trim() ?? ""
  if (base.includes(MCP_APP_CALL_HINT)) return base
  return base.length > 0 ? `${base} ${MCP_APP_CALL_HINT}` : MCP_APP_CALL_HINT
}

export function mcpAppToolNamesFromDescriptions(
  descriptions: Record<string, string> | undefined,
): string[] {
  return Object.entries(descriptions ?? {})
    .filter(([, text]) => text.includes(MCP_APP_CALL_HINT))
    .map(([toolName]) => toolName)
}
