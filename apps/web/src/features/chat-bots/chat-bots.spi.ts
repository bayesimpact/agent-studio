import type { ChatBot, CreateChatBotPayload, UpdateChatBotPayload } from "./chat-bots.models"

export interface IChatBotsSpi {
  getAll: (projectId: string) => Promise<ChatBot[]>
  createOne: (payload: CreateChatBotPayload) => Promise<ChatBot>
  updateOne: (chatBotId: string, payload: UpdateChatBotPayload) => Promise<void>
  deleteOne: (chatBotId: string) => Promise<void>
}
