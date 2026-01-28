import { useEffect } from "react"
import { ChatBot } from "@/components/chat-bots/ChatBot"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import { selectCurrentChatBot } from "@/features/chat-bots/chat-bots.selectors"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "./LoadingRoute"

export function ChatBotRoute() {
  const chatBot = useAppSelector(selectCurrentChatBot)

  const { setHeaderTitle } = useSidebarLayout()
  const headerTitle = chatBot ? chatBot.name : "Chat Bot"

  useEffect(() => {
    setHeaderTitle(headerTitle)
  }, [headerTitle, setHeaderTitle])

  if (!chatBot) return <LoadingRoute />
  return <ChatBot chatBot={chatBot} />
}
