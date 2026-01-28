import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { ChatBot } from "./chat-bot.entity"

export const chatBotFactory = Factory.define<ChatBot>(({ sequence, params }) => {
  const now = new Date()
  return {
    id: params.id || randomUUID(),
    name: params.name || `Test Chat Bot ${sequence}`,
    defaultPrompt: params.defaultPrompt || `This is a test default prompt for bot ${sequence}`,
    model: params.model || "gemini-1.5-pro",
    temperature: params.temperature ?? 0.7,
    locale: params.locale || "en",
    projectId: params.projectId || randomUUID(),
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
    project: params.project,
  } as ChatBot
})
