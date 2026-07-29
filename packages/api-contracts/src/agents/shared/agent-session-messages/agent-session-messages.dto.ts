import type { TimeType } from "../../../generic"

export enum ToolName {
  FillForm = "fillForm",
  LookupKnowledgeBase = "lookup_knowledge_base",
  Sources = "sources",
  RecalculateConversationSessionMetadata = "recalculateConversationSessionMetadata",
  McpSearchResources = "search_resources",
  McpSmartSearch = "smart_search",
  SurfaceResources = "surfaceResources",
  /**
   * Composite turn-summary tool exposed to the LLM: one call carries the
   * used chunkIds (sources) and/or the session categorization. Its execution
   * is logged as separate Sources / RecalculateConversationSessionMetadata
   * entries so persisted tool calls and the UI keep their historical names.
   */
  SubmitTurnSummary = "submit_turn_summary",
}

export type AgentSessionToolName = ToolName | (string & {})

export type AgentSessionMessageDto = {
  id: string
  role: "user" | "assistant" | "tool"
  content: string
  attachmentDocumentId?: string
  status?: "streaming" | "completed" | "aborted" | "error"
  createdAt?: TimeType
  startedAt?: TimeType
  completedAt?: TimeType
  /**
   * Revision of the agent settings that produced this message. Absent on messages built
   * client-side during a live stream, which are never refetched.
   */
  agentRevision?: number
  toolCalls?: Array<{
    id: string
    name: AgentSessionToolName
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

/** For `FileUploader` / dropzone `accept` (one flag per distinct MIME string). */
export const agentSessionMessageAttachmentAllowedMimeTypesForFileUploader = Object.fromEntries(
  agentSessionMessageAttachmentAllowedMimeTypes.map((mimeType) => [mimeType, true]),
) as Partial<Record<AgentSessionMessageAttachmentMimeType, boolean>>

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
  | { type: "notify_client"; toolName: AgentSessionToolName }
  | { type: "end"; messageId: string; fullContent: string }
  | { type: "error"; messageId: string; error: string }

export type StreamEvent = MessageEvent & StreamEventPayload
