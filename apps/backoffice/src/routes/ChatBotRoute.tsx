import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import { selectCurrentChatBot } from "@/features/chat-bots/chat-bots.selectors"
import { useAppSelector } from "@/store/hooks"

export function ChatBotRoute() {
  const { chatBotId, projectId } = useParams()
  const chatBot = useAppSelector(selectCurrentChatBot({ projectId, chatBotId }))

  const { setHeaderTitle } = useSidebarLayout()
  const headerTitle = chatBot ? `Chat Bot - ${chatBot.name}` : "Chat Bot"

  useEffect(() => {
    setHeaderTitle(headerTitle)
  }, [headerTitle, setHeaderTitle])

  return <div>TODO: Chat Bot {JSON.stringify(chatBot)}</div>
}
