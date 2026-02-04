import { AdminChatSession, AppChatSession } from "@/components/chat-bots/ChatSession"
import { selectCurrentChatBotId } from "@/features/chat-bots/chat-bots.selectors"
import type { ChatSession, ChatSessionMessage } from "@/features/chat-sessions/chat-sessions.models"
import {
  selectCurrentChatSessionDataFromChatBotId,
  selectCurrentMessagesData,
} from "@/features/chat-sessions/chat-sessions.selectors"
import { useAbility } from "@/hooks/use-ability"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "./LoadingRoute"
import { NotFoundRoute } from "./NotFoundRoute"

export function ChatSessionRoute() {
  const chatBotId = useAppSelector(selectCurrentChatBotId)
  const chatSession = useAppSelector(selectCurrentChatSessionDataFromChatBotId(chatBotId))
  const messages = useAppSelector(selectCurrentMessagesData)

  if (ADS.isError(chatSession) || ADS.isError(messages)) return <NotFoundRoute />

  if (ADS.isFulfilled(chatSession) && ADS.isFulfilled(messages)) {
    return <WithData chatSession={chatSession.value} messages={messages.value} />
  }

  return <LoadingRoute />
}

function WithData({
  chatSession,
  messages,
}: {
  chatSession: ChatSession
  messages: ChatSessionMessage[]
}) {
  const { isAdminInterface } = useAbility()
  if (isAdminInterface) return <AdminChatSession session={chatSession} messages={messages} />
  return <AppChatSession session={chatSession} messages={messages} />
}
