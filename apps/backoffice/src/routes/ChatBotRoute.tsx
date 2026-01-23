import { useLoaderData } from "react-router-dom"
import type { ChatBotLoaderData } from "./loaders/load-chat-bot"

export function ChatBotRoute() {
  const data = useLoaderData<ChatBotLoaderData>()

  return <div>TODO: Chat Bot {JSON.stringify(data)}</div>
}
