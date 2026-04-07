import { useOutlet } from "react-router-dom"
import { ErrorRoute } from "@/common/routes/ErrorRoute"
import type { Agent } from "@/features/agents/agents.models"
import type { FormAgentSession } from "@/features/agents/form-agent-sessions/form-agent-sessions.models"
import { selectCurrentOrganizationId } from "@/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/features/projects/projects.selectors"
import { useAppSelector } from "@/store/hooks"
import { Grid, GridContent } from "@/studio/components/grid/Grid"
import { AgentSessionListHeader } from "../../components/AgentSessionListHeader"
import { AgentSessionItem } from "../../conversation-agent-sessions/components/AgentSessionItem"

export function FormAgentSessionList({
  agent,
  agentSessions,
}: {
  agent: Agent
  agentSessions: FormAgentSession[]
}) {
  const outlet = useOutlet()
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)

  if (!organizationId || !projectId)
    return <ErrorRoute error={"Missing organization or project ID"} />

  if (outlet) return outlet
  return (
    <>
      <AgentSessionListHeader
        agent={agent}
        withBorderBottom={agentSessions.length > 0}
        backTo={outlet ? "agent" : "project"}
        organizationId={organizationId}
        projectId={projectId}
      />

      <Grid cols={3} total={agentSessions.length}>
        <GridContent>
          {agentSessions.map((session, index) => (
            <AgentSessionItem
              index={index}
              key={session.id}
              organizationId={organizationId}
              projectId={projectId}
              agentSession={session}
              agentId={agent.id}
            />
          ))}
        </GridContent>
      </Grid>
    </>
  )
}
