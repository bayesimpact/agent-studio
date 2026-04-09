import type { Agent } from "@/common/features/agents/agents.models"
import { selectAgentsData } from "@/common/features/agents/agents.selectors"
import type { Project } from "@/common/features/projects/projects.models"
import {
  selectCurrentProjectData,
  selectCurrentProjectId,
} from "@/common/features/projects/projects.selectors"
import { useAppSelector } from "@/common/store/hooks"
import { AsyncRoute } from "./AsyncRoute"
import { LoadingRoute } from "./LoadingRoute"

export function ProjectRoute({
  children,
}: {
  children: (agents: Agent[], project: Project) => React.ReactNode
}) {
  const projectId = useAppSelector(selectCurrentProjectId)
  const project = useAppSelector(selectCurrentProjectData)
  const agents = useAppSelector(selectAgentsData)

  if (!projectId) return <LoadingRoute />
  return (
    <AsyncRoute data={[agents, project]}>
      {([agentsValue, projectValue]) => children(agentsValue, projectValue)}
    </AsyncRoute>
  )
}
