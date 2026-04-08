import type { Agent } from "@/common/features/agents/agents.models"
import { selectAgentsData } from "@/common/features/agents/agents.selectors"
import type { Project } from "@/common/features/projects/projects.models"
import { selectCurrentProjectData } from "@/common/features/projects/projects.selectors"
import { useAppSelector } from "@/common/store/hooks"
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
