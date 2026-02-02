import { AdminChatSession, AppChatSession } from "@/components/chat-bots/ChatSession"
import { selectCurrentChatSession } from "@/features/chat-sessions/chat-sessions.selectors"
import { useAbility } from "@/hooks/use-ability"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "./LoadingRoute"

export function ChatSessionRoute() {
  const { admin } = useAbility()
  const chatSession = useAppSelector(selectCurrentChatSession)

  if (!chatSession) return <LoadingRoute />
  if (admin) return <AdminChatSession session={chatSession} />
  return <AppChatSession session={chatSession} />
}
