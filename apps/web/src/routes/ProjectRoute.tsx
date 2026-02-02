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
import { CreateChatBotDialogWithoutTrigger } from "@/components/chat-bots/CreateChatBotDialog"
// import { AdminChatBotsList, AppChatBotsList } from "@/components/chat-bots/ChatBotsList"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import type { ChatBot } from "@/features/chat-bots/chat-bots.models"
import type { Project } from "@/features/projects/projects.models"
import { useAbility } from "@/hooks/use-ability"
import { useBuildPath } from "@/hooks/use-build-path"

export function ProjectRoute({ project, chatBots }: { project: Project; chatBots: ChatBot[] }) {
  const outlet = useOutlet()
  const { admin } = useAbility()
  const { buildPath } = useBuildPath()
  const firstChatBot = chatBots?.[0]

  useHandleHeader({ project, outlet })

  if (outlet) return outlet

  if (firstChatBot)
    return <Navigate to={buildPath("chatBot", { chatBotId: firstChatBot.id })} replace />

  if (admin) return <NoChatBot project={project} />

  return null
}

function useHandleHeader({
  project,
  outlet,
}: {
  project: Project | null
  outlet: ReturnType<typeof useOutlet>
}) {
  const { setHeaderTitle } = useSidebarLayout()
  const headerTitle = project ? project.name : "Dashboard"

  useEffect(() => {
    if (outlet) return
    setHeaderTitle(headerTitle)
  }, [outlet, headerTitle, setHeaderTitle])
}

function NoChatBot({ project }: { project: Project }) {
  const { t } = useTranslation("chatBot", { keyPrefix: "list" })
  const [open, setOpen] = useState(false)
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
          <CreateChatBotDialogWithoutTrigger
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
