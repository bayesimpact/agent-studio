import type { ChatSession, ChatSessionMessage } from "./chat-session.models"

export interface IChatSessionSpi {
  createPlaygroundSession: (chatBotId: string) => Promise<ChatSession>
  getMessages: (sessionId: string) => Promise<ChatSessionMessage[]>
}
