import type { ChatSession } from "./chat-session.models"

export interface IChatSessionSpi {
  createPlaygroundSession: (chatBotId: string) => Promise<ChatSession>
}
