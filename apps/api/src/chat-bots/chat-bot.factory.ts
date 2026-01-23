import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { ChatBot } from "./chat-bot.entity"

export const chatBotFactory = Factory.define<ChatBot>(({ sequence, params }) => {
  const now = new Date()
  return {
    id: params.id || randomUUID(),
    name: params.name || `Test Chat Bot ${sequence}`,
    defaultPrompt: params.defaultPrompt || `This is a test default prompt for bot ${sequence}`,
    projectId: params.projectId || randomUUID(),
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
    project: params.project,
  } as ChatBot
})
