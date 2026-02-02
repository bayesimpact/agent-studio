import { AdminChatSession, AppChatSession } from "@/components/chat-bots/ChatSession"
import type { ChatSession, ChatSessionMessage } from "@/features/chat-sessions/chat-sessions.models"
import { useAbility } from "@/hooks/use-ability"

export function ChatSessionRoute({
  chatSession,
  messages,
}: {
  chatSession: ChatSession
  messages: ChatSessionMessage[]
}) {
  const { admin } = useAbility()
  if (admin) return <AdminChatSession session={chatSession} messages={messages} />
  return <AppChatSession session={chatSession} messages={messages} />
}
