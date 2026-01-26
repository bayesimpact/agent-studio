import type { MessageDto } from "./message.dto"

export type CreateChatSessionResponseDto = {
  sessionId: string
  message: MessageDto
}
