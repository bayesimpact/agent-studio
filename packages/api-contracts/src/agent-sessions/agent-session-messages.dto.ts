export type AgentSessionMessageDto = {
  id: string
  role: "user" | "assistant"
  content: string
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

export type ListAgentSessionMessagesResponseDto = {
  sessionId: string
  messages: AgentSessionMessageDto[]
}
