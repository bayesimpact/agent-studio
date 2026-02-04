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
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import type { ChatBot } from "@/features/chat-bots/chat-bots.models"
import { selectChatBotsFromProjectId } from "@/features/chat-bots/chat-bots.selectors"
import type { Project } from "@/features/projects/projects.models"
import { selectCurrentProjectId, selectProjectData } from "@/features/projects/projects.selectors"
import { useAbility } from "@/hooks/use-ability"
import { useBuildPath } from "@/hooks/use-build-path"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "./LoadingRoute"
import { NotFoundRoute } from "./NotFoundRoute"

export function ProjectRoute() {
  const project = useAppSelector(selectProjectData)
  const projectId = useAppSelector(selectCurrentProjectId)
  const chatBots = useAppSelector(selectChatBotsFromProjectId(projectId))

  if (ADS.isError(project) || ADS.isError(chatBots)) return <NotFoundRoute />

  if (ADS.isFulfilled(project) && ADS.isFulfilled(chatBots)) {
    return <WithData project={project.value} chatBots={chatBots.value} />
  }

  return <LoadingRoute />
}

function WithData({ project, chatBots }: { project: Project; chatBots: ChatBot[] }) {
  const outlet = useOutlet()
  const { isAdminInterface } = useAbility()
  const { buildPath } = useBuildPath()
  useHandleHeader({ project, outlet })
  const firstChatBot = chatBots?.[0]

  if (outlet) return outlet

  if (firstChatBot)
    return (
      <Navigate
        to={buildPath("chatBot", {
          organizationId: project.organizationId,
          projectId: project.id,
          chatBotId: firstChatBot.id,
        })}
        replace
      />
    )

  if (isAdminInterface) return <NoChatBot project={project} />
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
    return () => {
      setHeaderTitle("")
    }
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
            project={project}
            isOpen={open}
            onOpenChange={setOpen}
          />
        </CardContent>
      </Card>
    </div>
  )
}
