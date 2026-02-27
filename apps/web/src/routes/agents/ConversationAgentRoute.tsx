import { useTranslation } from "react-i18next"
import { Outlet, useOutlet } from "react-router-dom"
import { AgentSessionCreator } from "@/components/agent-session/AgentSessionCreator"
import { AgentSessionItem } from "@/components/agent-session/AgentSessionItem"
import { ListHeader } from "@/components/layouts/ListHeader"
import type { AgentSession } from "@/features/agent-sessions/agent-sessions.models"
import { selectCurrentAgentSessionsData } from "@/features/agent-sessions/agent-sessions.selectors"
import type { Agent } from "@/features/agents/agents.models"
import { useGetPath } from "@/hooks/use-build-path"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { ErrorRoute } from "../ErrorRoute"
import { LoadingRoute } from "../LoadingRoute"
import { useHandleHeader } from "./Header"

export function ConversationAgentRoute({
  agent,
  organizationId,
  projectId,
}: {
  agent: Agent
  organizationId: string
  projectId: string
}) {
  useHandleHeader(agent)

  const agentSessions = useAppSelector(selectCurrentAgentSessionsData)

  if (ADS.isError(agentSessions))
    return <ErrorRoute error={agentSessions.error || "Unknown error"} />
  if (ADS.isFulfilled(agentSessions)) {
    return (
      <ConversationAgentWithData
        agentSessions={agentSessions.value}
        agent={agent}
        organizationId={organizationId}
        projectId={projectId}
      />
    )
  }
  return <LoadingRoute />
}

function ConversationAgentWithData({
  agent,
  agentSessions,
  organizationId,
  projectId,
}: {
  agent: Agent
  agentSessions: AgentSession[]
  organizationId: string
  projectId: string
}) {
  const { t } = useTranslation()
  const { getPath } = useGetPath()
  const outlet = useOutlet()

  if (outlet) return <Outlet />
  return (
    <ListHeader path={getPath("agent")} title={t("agentSession:list.title")}>
      <AgentSessionCreator
        type="button"
        organizationId={organizationId}
        projectId={projectId}
        agentId={agent.id}
      />

      {agentSessions.map((agentSession) => (
        <AgentSessionItem
          key={agentSession.id}
          organizationId={organizationId}
          projectId={projectId}
          agentId={agent.id}
          agentSession={agentSession}
        />
      ))}
    </ListHeader>
  )
}
