import { useEffect } from "react"
import { useOutlet } from "react-router-dom"
import { ChatBotsList } from "@/components/chat-bots/ChatBotsList"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import { selectChatBots } from "@/features/chat-bots/chat-bots.selectors"
import { selectCurrentProject } from "@/features/projects/projects.selectors"
import { useAppSelector } from "@/store/hooks"
import { NotFoundRoute } from "./NotFoundRoute"

export function ProjectRoute() {
  const outlet = useOutlet()

  const project = useAppSelector(selectCurrentProject)
  const chatBots = useAppSelector(selectChatBots(project?.id)) || []

  const { setHeaderTitle } = useSidebarLayout()
  const headerTitle = project ? project.name : "Dashboard"

  useEffect(() => {
    if (outlet) return
    setHeaderTitle(headerTitle)
  }, [outlet, headerTitle, setHeaderTitle])

  if (!project) return <NotFoundRoute />

  if (outlet) return outlet
  return <ChatBotsList project={project} chatBots={chatBots} />
}
