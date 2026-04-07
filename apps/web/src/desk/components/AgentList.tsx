import { useTranslation } from "react-i18next"
import { useOutlet } from "react-router-dom"
import { ListHeader } from "@/desk/components/ListHeader"
import { useDeskGetPath } from "@/desk/hooks/use-desk-build-path"
import type { Agent } from "@/features/agents/agents.models"
import { AgentItem } from "@/features/agents/components/AgentItem"
import type { Project } from "@/features/projects/projects.models"

export function AgentList({ project, agents }: { project: Project; agents: Agent[] }) {
  const { t } = useTranslation()
  const { getDeskPath } = useDeskGetPath()
  const outlet = useOutlet()

  if (outlet) return outlet
  return (
    <ListHeader path={getDeskPath("project")} title={t("agent:list.title")}>
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
