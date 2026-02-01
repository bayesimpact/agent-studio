import { randomUUID } from "node:crypto"
import { ChatBotLocale, ChatBotModel } from "@caseai-connect/api-contracts"
import { Factory } from "fishery"
import type { Project } from "@/projects/project.entity"
import type { ChatBot } from "./chat-bot.entity"

type ChatBotTransientParams = {
  project: Project
}

class ChatBotFactory extends Factory<ChatBot, ChatBotTransientParams> {}

export const chatBotFactory = ChatBotFactory.define(({ sequence, params, transientParams }) => {
  if (!transientParams.project) {
    throw new Error("project transient is required")
  }

  const now = new Date()
  return {
    id: params.id || randomUUID(),
    name: params.name || `Test Chat Bot ${sequence}`,
    defaultPrompt: params.defaultPrompt || `This is a test default prompt for bot ${sequence}`,
    model: params.model || ChatBotModel.Gemini25Flash,
    temperature: params.temperature ?? 0.7,
    locale: params.locale || ChatBotLocale.EN,
    projectId: transientParams.project.id,
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
    project: transientParams.project,
    chatSessions: params.chatSessions || [],
  } satisfies ChatBot
})
