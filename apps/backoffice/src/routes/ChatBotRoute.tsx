import { useEffect } from "react"
import { useLoaderData } from "react-router-dom"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import type { ChatBotLoaderData } from "./loaders/load-chat-bot"

export function ChatBotRoute() {
  const chatBot = useLoaderData<ChatBotLoaderData>()

  const { setHeaderTitle } = useSidebarLayout()
  const headerTitle = chatBot ? `Chat Bot - ${chatBot.name}` : "Chat Bot"

  useEffect(() => {
    setHeaderTitle(headerTitle)
  }, [headerTitle, setHeaderTitle])

  return <div>TODO: Chat Bot {JSON.stringify(chatBot)}</div>
}
