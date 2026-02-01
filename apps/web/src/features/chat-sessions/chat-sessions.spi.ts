import type { ChatSession, ChatSessionMessage } from "./chat-sessions.models"

export interface IChatSessionsSpi {
  createPlaygroundSession: (chatBotId: string) => Promise<ChatSession>
  createAppSession: (params: {
    chatBotId: string
    chatSessionType: "app-private"
  }) => Promise<ChatSession>
  getMessages: (sessionId: string) => Promise<ChatSessionMessage[]>
}
