import { Button } from "@caseai-connect/ui/shad/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@caseai-connect/ui/shad/card"
import { Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Navigate, useOutlet } from "react-router-dom"
import { CreateChatBotDialog } from "@/components/chat-bots/CreateChatBotDialog"
// import { AdminChatBotsList, AppChatBotsList } from "@/components/chat-bots/ChatBotsList"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import { selectChatBotsFromProjectId } from "@/features/chat-bots/chat-bots.selectors"
import type { Project } from "@/features/projects/projects.models"
import { selectCurrentProject } from "@/features/projects/projects.selectors"
import { useBuildPath } from "@/hooks/use-build-path"
import { useAppSelector } from "@/store/hooks"
import { NotFoundRoute } from "./NotFoundRoute"

export function ProjectRoute() {
  const outlet = useOutlet()
  const { buildPath } = useBuildPath()

  const project = useAppSelector(selectCurrentProject)
  const chatBots = useAppSelector(selectChatBotsFromProjectId(project?.id))
  const firstChatBot = chatBots?.[0]

  const { setHeaderTitle } = useSidebarLayout()
  const headerTitle = project ? project.name : "Dashboard"

  useEffect(() => {
    if (outlet) return
    setHeaderTitle(headerTitle)
  }, [outlet, headerTitle, setHeaderTitle])

  if (!project) return <NotFoundRoute />

  if (outlet) return outlet
  if (firstChatBot) {
    return <Navigate to={buildPath("chatBot", { chatBotId: firstChatBot.id })} replace />
  }
  return <NoChatBot project={project} />
}

function NoChatBot({ project }: { project: Project }) {
  const { t } = useTranslation("chatBot", { keyPrefix: "list" })
  const [open, setOpen] = useState(false)

  if (!project) return null
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("empty.title")}</CardTitle>
          <CardDescription>{t("empty.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("empty.button")}
          </Button>
          <CreateChatBotDialog
            projectId={project.id}
            projectName={project.name}
            isOpen={open}
            onOpenChange={setOpen}
          />
        </CardContent>
      </Card>
    </div>
  )
}
