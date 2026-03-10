import { useOutlet } from "react-router-dom"
import type { Agent } from "@/features/agents/agents.models"
import { selectAgentsData } from "@/features/agents/agents.selectors"
import { AgentList } from "@/features/agents/components/AgentList"
import type { Project } from "@/features/projects/projects.models"
import { selectCurrentProjectData } from "@/features/projects/projects.selectors"
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

  if (outlet) return outlet

  return <AgentList project={project} agents={agents} />
}
