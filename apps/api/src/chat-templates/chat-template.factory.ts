import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { ChatTemplate } from "./chat-template.entity"

export const chatTemplateFactory = Factory.define<ChatTemplate>(({ sequence, params }) => {
  const now = new Date()
  return {
    id: params.id || randomUUID(),
    name: params.name || `Test Chat Template ${sequence}`,
    defaultPrompt: params.defaultPrompt || `This is a test default prompt for template ${sequence}`,
    projectId: params.projectId || randomUUID(),
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
    project: params.project,
  } as ChatTemplate
})
