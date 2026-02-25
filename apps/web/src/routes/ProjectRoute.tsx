import { Navigate, useOutlet } from "react-router-dom"
import { EmptyAgent } from "@/components/agent/EmptyAgent"
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
import { ErrorRoute } from "./ErrorRoute"
import { LoadingRoute } from "./LoadingRoute"

export function ProjectRoute() {
  const project = useAppSelector(selectCurrentProjectData)
  const projectId = useAppSelector(selectCurrentProjectId)
  const agents = useAppSelector(selectAgentsFromProjectId(projectId))

  if (ADS.isError(project) || ADS.isError(agents))
    return <ErrorRoute error={project.error || agents.error || "Unknown error"} />

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

  if (isAdminInterface) return <EmptyAgent project={project} />
}
