import { AdminChatBot, AppChatBot } from "@/components/chat-bots/ChatBot"
import { selectCurrentChatSession } from "@/features/chat-sessions/chat-sessions.selectors"
import { useAbility } from "@/hooks/use-ability"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "./LoadingRoute"

export function ChatSessionRoute() {
  const { admin } = useAbility()
  const chatSession = useAppSelector(selectCurrentChatSession)

  if (!chatSession) return <LoadingRoute />
  if (admin) return <AdminChatBot session={chatSession} />
  return <AppChatBot session={chatSession} />
}
