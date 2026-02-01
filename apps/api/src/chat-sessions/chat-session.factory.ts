import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { ChatSession } from "./chat-session.entity"

export const chatSessionFactory = Factory.define<ChatSession>(({ params }) => {
  const now = new Date()
  return {
    id: params.id || randomUUID(),
    chatbotId: params.chatbotId || randomUUID(),
    userId: params.userId || randomUUID(),
    organizationId: params.organizationId || randomUUID(),
    type: params.type || "playground",
    messages: params.messages || [],
    expiresAt: params.expiresAt || null,
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
  } as ChatSession
})
