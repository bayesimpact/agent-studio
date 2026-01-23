import { useEffect } from "react"
import { useLoaderData, useOutlet } from "react-router-dom"
import { ChatBotsList } from "@/components/chat-bots/ChatBotsList"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import type { ProjectAndChatBotsLoaderData } from "./loaders/load-project"
import { NotFoundRoute } from "./NotFoundRoute"

export function ProjectRoute() {
  const outlet = useOutlet()

  const data = useLoaderData<ProjectAndChatBotsLoaderData>()
  const project = data?.project
  const chatBots = data?.chatBots || []

  const { setHeaderTitle } = useSidebarLayout()
  const headerTitle = project ? `${project.name} - Chat Bots` : "Dashboard"

  useEffect(() => {
    setHeaderTitle(headerTitle)
  }, [headerTitle, setHeaderTitle])

  if (!project) return <NotFoundRoute />

  if (outlet) return outlet
  return <ChatBotsList project={project} chatBots={chatBots} />
}
