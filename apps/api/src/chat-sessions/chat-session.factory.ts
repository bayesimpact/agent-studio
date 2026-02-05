import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { Agent } from "@/agents/agent.entity"
import type { Organization } from "@/organizations/organization.entity"
import type { User } from "@/users/user.entity"
import type { ChatSession } from "./chat-session.entity"

type ChatSessionTransientParams = {
  agent: Agent
  user: User
  organization: Organization
}

class ChatSessionFactory extends Factory<ChatSession, ChatSessionTransientParams> {
  playground() {
    return this.params({ type: "playground" })
  }

  production() {
    return this.params({ type: "production" })
  }

  appPrivate() {
    return this.params({ type: "app-private" })
  }

  expiredMinutesAgo(minutes: number) {
    return this.params({ expiresAt: new Date(Date.now() - minutes * 60 * 1000) })
  }
}

export const chatSessionFactory = ChatSessionFactory.define(({ params, transientParams }) => {
  if (!transientParams.agent) {
    throw new Error("agent transient is required")
  }
  if (!transientParams.user) {
    throw new Error("user transient is required")
  }
  if (!transientParams.organization) {
    throw new Error("organization transient is required")
  }

  const now = new Date()
  const defaultExpiresAt =
    params.type === "playground"
      ? new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours from now
      : null

  return {
    id: params.id || randomUUID(),
    chatBotId: transientParams.agent.id,
    userId: transientParams.user.id,
    organizationId: transientParams.organization.id,
    type: params.type || "playground",
    expiresAt: params.expiresAt ?? defaultExpiresAt,
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
    chatbot: transientParams.agent,
    user: transientParams.user,
    organization: transientParams.organization,
    messages: params.messages || [],
  } satisfies ChatSession
})
