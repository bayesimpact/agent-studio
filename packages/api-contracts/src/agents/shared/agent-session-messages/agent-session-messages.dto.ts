export enum ToolName {
  FillForm = "fillForm",
  RetrieveProjectDocumentChunks = "retrieveProjectDocumentChunks",
  Sources = "sources",
  McpSearchResources = "search_resources",
  McpSmartSearch = "smart_search",
}

export type AgentSessionMessageDto = {
  id: string
  role: "user" | "assistant" | "tool"
  content: string
  documentId?: string
  status?: "streaming" | "completed" | "aborted" | "error"
  createdAt?: string
  startedAt?: string
  completedAt?: string
  toolCalls?: Array<{
    id: string
    name: ToolName
    arguments: Record<string, unknown>
  }>
}

export type StreamEventPayload =
  | { type: "start"; messageId: string }
  | { type: "chunk"; content: string; messageId: string }
  | { type: "notify_client"; toolName: ToolName }
  | { type: "end"; messageId: string; fullContent: string }
  | { type: "error"; messageId: string; error: string }

export type StreamEvent = MessageEvent & StreamEventPayload
