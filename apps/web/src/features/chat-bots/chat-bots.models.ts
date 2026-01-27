export type ChatBot = {
  id: string
  name: string
  defaultPrompt: string
  projectId: string
  createdAt: number
  updatedAt: number
}

export type CreateChatBotPayload = {
  name: string
  defaultPrompt: string
  projectId: string
}

export type UpdateChatBotPayload = {
  name?: string
  defaultPrompt?: string
}
