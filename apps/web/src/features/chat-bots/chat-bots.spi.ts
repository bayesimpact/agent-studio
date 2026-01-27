import type { ChatBot, CreateChatBotPayload, UpdateChatBotPayload } from "./chat-bots.models"

export interface IChatBotsSpi {
  listChatBots: (projectId: string) => Promise<ChatBot[]>
  createChatBot: (payload: CreateChatBotPayload) => Promise<ChatBot>
  updateChatBot: (chatBotId: string, payload: UpdateChatBotPayload) => Promise<void>
  deleteChatBot: (chatBotId: string) => Promise<void>
}
