import { Button } from "@caseai-connect/ui/shad/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@caseai-connect/ui/shad/card"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Navigate, useOutlet } from "react-router-dom"
import { CreateAgentDialogWithoutTrigger } from "@/components/agents/CreateAgentDialog"
import type { Agent } from "@/features/agents/agents.models"
import { selectAgentsFromProjectId } from "@/features/agents/agents.selectors"
import type { Project } from "@/features/projects/projects.models"
import {
  selectCurrentProjectData,
  selectCurrentProjectId,
} from "@/features/projects/projects.selectors"
import { useAbility } from "@/hooks/use-ability"
import { useBuildPath } from "@/hooks/use-build-path"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "./LoadingRoute"
import { NotFoundRoute } from "./NotFoundRoute"

export function ProjectRoute() {
  const project = useAppSelector(selectCurrentProjectData)
  const projectId = useAppSelector(selectCurrentProjectId)
  const agents = useAppSelector(selectAgentsFromProjectId(projectId))

  if (ADS.isError(project) || ADS.isError(agents)) return <NotFoundRoute />

  if (ADS.isFulfilled(project) && ADS.isFulfilled(agents)) {
    return <WithData project={project.value} agents={agents.value} />
  }

  return <LoadingRoute />
}

function WithData({ project, agents }: { project: Project; agents: Agent[] }) {
  const outlet = useOutlet()
  const { isAdminInterface } = useAbility()
  const { buildPath } = useBuildPath()
  const firstAgent = agents?.[0]

  if (outlet) return outlet

  if (firstAgent)
    return (
      <Navigate
        to={buildPath("agent", {
          organizationId: project.organizationId,
          projectId: project.id,
          agentId: firstAgent.id,
        })}
        replace
      />
    )

  if (isAdminInterface) return <NoAgent project={project} />
}

function NoAgent({ project }: { project: Project }) {
  const { t } = useTranslation("agent", { keyPrefix: "list" })
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
          <CreateAgentDialogWithoutTrigger project={project} isOpen={open} onOpenChange={setOpen} />
        </CardContent>
      </Card>
    </div>
  )
}
