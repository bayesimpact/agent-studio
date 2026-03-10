import { Button } from "@caseai-connect/ui/shad/button"
import { PlusIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useOutlet } from "react-router-dom"
import { ListHeader } from "@/components/layouts/ListHeader"
import type { Agent } from "@/features/agents/agents.models"
import { selectAgentsData } from "@/features/agents/agents.selectors"
import { AgentCreator } from "@/features/agents/components/AgentCreator"
import { AgentItem } from "@/features/agents/components/AgentItem"
import type { Project } from "@/features/projects/projects.models"
import { selectCurrentProjectData } from "@/features/projects/projects.selectors"
import { useAbility } from "@/hooks/use-ability"
import { useGetPath } from "@/hooks/use-build-path"
import { useAppSelector } from "@/store/hooks"
import { AsyncRoute } from "./AsyncRoute"

export function ProjectRoute() {
  const project = useAppSelector(selectCurrentProjectData)
  const agents = useAppSelector(selectAgentsData)

  return (
    <AsyncRoute data={[agents, project]}>
      {([agentsValue, projectValue]) => <WithData project={projectValue} agents={agentsValue} />}
    </AsyncRoute>
  )
}

function WithData({ project, agents }: { project: Project; agents: Agent[] }) {
  const outlet = useOutlet()
  const { t } = useTranslation()
  const { getPath } = useGetPath()
  const { isAdminInterface } = useAbility()

  if (outlet) return outlet

  if (!isAdminInterface) return null

  return (
    <ListHeader path={getPath("project")} title={t("agent:list.title")}>
      <AgentCreatorButton project={project} />

      {agents.map((agent) => (
        <AgentItem
          key={agent.id}
          organizationId={project.organizationId}
          projectId={agent.projectId}
          agent={agent}
        />
      ))}
    </ListHeader>
  )
}

function AgentCreatorButton({ project }: { project: Project }) {
  const { t } = useTranslation("agent", { keyPrefix: "create" })
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon className="mr-2 size-4" />
        {t("button")}
      </Button>
      <AgentCreator project={project} open={open} onOpenChange={setOpen} />
    </>
  )
}
