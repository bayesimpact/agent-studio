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

export type MessageResponseDto = {
  message: MessageDto
}

export type CreateChatSessionResponseDto = {
  sessionId: string
  message: MessageDto
}

export type SendMessageDto = {
  sessionId: string
  content: string
  country?: string
}
