import type { ChatBot } from "./chat-bots.models"

export interface IChatBotsSpi {
  getAll: (params: { projectId: string }) => Promise<ChatBot[]>
  createOne: (
    params: { projectId: string },
    payload: Pick<ChatBot, "name" | "defaultPrompt">,
  ) => Promise<void>
  updateOne: (
    params: { chatBotId: string; projectId: string },
    payload: Partial<Pick<ChatBot, "name" | "defaultPrompt">>,
  ) => Promise<void>
  deleteOne: (params: { chatBotId: string; projectId: string }) => Promise<void>
}
