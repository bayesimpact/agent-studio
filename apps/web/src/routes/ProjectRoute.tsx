import { Navigate, useOutlet } from "react-router-dom"
import type { Agent } from "@/features/agents/agents.models"
import { selectAgentsData } from "@/features/agents/agents.selectors"
import { EmptyAgent } from "@/features/agents/components/EmptyAgent"
import type { Project } from "@/features/projects/projects.models"
import { selectCurrentProjectData } from "@/features/projects/projects.selectors"
import { useAbility } from "@/hooks/use-ability"
import { useBuildPath } from "@/hooks/use-build-path"
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
  const { isAdminInterface } = useAbility()
  const { buildPath } = useBuildPath()
  const firstAgent = agents?.[0]

  if (outlet) return outlet

  if (firstAgent) {
    const agentPath = buildPath("agent", {
      organizationId: project.organizationId,
      projectId: project.id,
      agentId: firstAgent.id,
    })
    return <Navigate to={agentPath} replace />
  }

  if (isAdminInterface) return <EmptyAgent project={project} />
}
