import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { Repository } from "typeorm"
import type { AgentSession } from "./agent-session.entity"
import type { ChatMessage } from "./chat-message.entity"

type ChatMessageTransientParams = {
  session: AgentSession
}

class ChatMessageFactory extends Factory<ChatMessage, ChatMessageTransientParams> {
  user() {
    return this.params({ role: "user" })
  }

  assistant() {
    return this.params({ role: "assistant" })
  }

  streaming() {
    return this.params({ status: "streaming" })
  }

  sentMinutesAgo(minutes: number) {
    return this.params({ startedAt: new Date(Date.now() - minutes * 60 * 1000) })
  }
}

export const chatMessageFactory = ChatMessageFactory.define(
  ({ sequence, params, transientParams }) => {
    if (!transientParams.session) {
      throw new Error("session transient is required")
    }

    const now = new Date()
    return {
      id: params.id || randomUUID(),
      sessionId: transientParams.session.id,
      role: params.role || (sequence % 2 === 0 ? "user" : "assistant"),
      content: params.content || `Test message ${sequence}`,
      status: params.status ?? null,
      startedAt: params.startedAt ?? null,
      completedAt: params.completedAt ?? null,
      toolCalls: params.toolCalls ?? null,
      createdAt: params.createdAt || now,
      session: transientParams.session,
    } satisfies ChatMessage
  },
)

type BuildChatConversationParams = {
  userMessage?: Partial<ChatMessage>
  assistantMessage?: Partial<ChatMessage>
}

export function buildChitChatConversation(
  session: AgentSession,
  params: BuildChatConversationParams = {},
): [ChatMessage, ChatMessage] {
  const userMessage = chatMessageFactory
    .user()
    .transient({ session })
    .build({
      content: "Hello",
      ...params.userMessage,
    })

  const assistantMessage = chatMessageFactory
    .assistant()
    .transient({ session })
    .build({
      content: "Hi!",
      ...params.assistantMessage,
    })

  return [userMessage, assistantMessage]
}

type CreateAgentSessionMessageRepositories = {
  chatMessageRepository: Repository<ChatMessage>
}

export async function createChitChatConversation(
  session: AgentSession,
  repositories: CreateAgentSessionMessageRepositories,
  params: BuildChatConversationParams = {},
): Promise<[ChatMessage, ChatMessage]> {
  const [userMessage, assistantMessage] = buildChitChatConversation(session, params)
  await repositories.chatMessageRepository.save([userMessage, assistantMessage])
  return [userMessage, assistantMessage]
}
