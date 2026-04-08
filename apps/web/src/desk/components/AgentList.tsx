import { useTranslation } from "react-i18next"
import { useOutlet } from "react-router-dom"
import { ListHeader } from "@/desk/components/ListHeader"
import type { Agent } from "@/features/agents/agents.models"
import { AgentItem } from "@/features/agents/components/AgentItem"
import type { Project } from "@/features/projects/projects.models"
import { useGetPath } from "@/hooks/use-build-path"

export function AgentList({ project, agents }: { project: Project; agents: Agent[] }) {
  const { t } = useTranslation()
  const { getPath } = useGetPath()
  const outlet = useOutlet()

  if (outlet) return outlet
  return (
    <ListHeader path={getPath("project")} title={t("agent:list.title")}>
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
