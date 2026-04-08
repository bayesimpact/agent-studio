import type { Project } from "@/common/features/projects/projects.models"
import { selectCurrentProjectData } from "@/common/features/projects/projects.selectors"
import { useAppSelector } from "@/common/store/hooks"
import type { Agent } from "@/features/agents/agents.models"
import { selectAgentsData } from "@/features/agents/agents.selectors"
import { AsyncRoute } from "./AsyncRoute"

export function ProjectRoute({
  children,
}: {
  children: (agents: Agent[], project: Project) => React.ReactNode
}) {
  const project = useAppSelector(selectCurrentProjectData)
  const agents = useAppSelector(selectAgentsData)

  return (
    <AsyncRoute data={[agents, project]}>
      {([agentsValue, projectValue]) => children(agentsValue, projectValue)}
    </AsyncRoute>
  )
}
