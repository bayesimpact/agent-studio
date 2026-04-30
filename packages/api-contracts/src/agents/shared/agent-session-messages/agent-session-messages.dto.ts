export enum ToolName {
  FillForm = "fillForm",
  RetrieveProjectDocumentChunks = "retrieveProjectDocumentChunks",
  Sources = "sources",
  RecalculateConversationSessionMetadata = "recalculateConversationSessionMetadata",
  McpSearchResources = "search_resources",
  McpSmartSearch = "smart_search",
}

export type AgentSessionMessageDto = {
  id: string
  role: "user" | "assistant" | "tool"
  content: string
  attachmentDocumentId?: string
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

export const agentSessionMessageAttachmentAllowedMimeTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
] as const

export type AgentSessionMessageAttachmentMimeType =
  (typeof agentSessionMessageAttachmentAllowedMimeTypes)[number]

export type PresignAgentSessionMessageAttachmentDocumentRequestDto = {
  fileName: string
  mimeType: AgentSessionMessageAttachmentMimeType
  size: number
}

export type PresignAgentSessionMessageAttachmentDocumentResponseDto = {
  attachmentDocumentId: string
  uploadUrl: string
}

export type StreamEventPayload =
  | { type: "start"; messageId: string }
  | { type: "chunk"; content: string; messageId: string }
  | { type: "notify_client"; toolName: ToolName }
  | { type: "end"; messageId: string; fullContent: string }
  | { type: "error"; messageId: string; error: string }

export type StreamEvent = MessageEvent & StreamEventPayload
