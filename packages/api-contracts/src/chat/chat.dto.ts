// Message entity DTO
export type MessageDto = {
  id: string
  content: string | null
  sender: "user" | "assistant" | "tool"
  timestamp: Date
  toolCalls?: Array<{
    id: string
    name: string
    arguments: Record<string, unknown>
  }>
  toolCallId?: string
}

// Create chat session DTOs
export type CreateChatSessionResponseDto = {
  sessionId: string
  message: MessageDto
}

// Send message DTOs
export type SendMessageDto = {
  sessionId: string
  content: string
  country?: string
}

// Message response DTOs
export type MessageResponseDto = {
  message: MessageDto
}
