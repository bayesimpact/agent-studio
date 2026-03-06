export type AgentSessionMessageDto = {
  id: string
  role: "user" | "assistant"
  content: string
  documentId?: string
  status?: "streaming" | "completed" | "aborted" | "error"
  createdAt?: string
  startedAt?: string
  completedAt?: string
  toolCalls?: Array<{
    id: string
    name: string
    arguments: Record<string, unknown>
  }>
}

export type StreamEventPayload =
  | { type: "start"; messageId: string }
  | { type: "chunk"; content: string; messageId: string }
  | { type: "notify_client" }
  | { type: "end"; messageId: string; fullContent: string }
  | { type: "error"; messageId: string; error: string }

export type StreamEvent = MessageEvent & StreamEventPayload
