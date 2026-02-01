import type { ChatSession, ChatSessionMessage } from "./chat-sessions.models"

export interface IChatSessionsSpi {
  getAllPlayground: (chatBotId: string) => Promise<ChatSession[]>
  getAllApp: (chatBotId: string) => Promise<ChatSession[]>
  createPlaygroundSession: (chatBotId: string) => Promise<ChatSession>
  createAppSession: (params: {
    chatBotId: string
    chatSessionType: "app-private"
  }) => Promise<ChatSession>
  getMessages: (sessionId: string) => Promise<ChatSessionMessage[]>
}
