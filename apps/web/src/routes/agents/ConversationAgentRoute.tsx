import { useTranslation } from "react-i18next"
import { Outlet, useOutlet } from "react-router-dom"
import { ListHeader } from "@/components/layouts/ListHeader"
import type { Agent } from "@/features/agents/agents.models"
import { ConversationAgentSessionCreator } from "@/features/agents/conversation-agent-sessions/components/ConversationAgentSessionCreator"
import { ConversationAgentSessionItem } from "@/features/agents/conversation-agent-sessions/components/ConversationAgentSessionItem"
import type { ConversationAgentSession } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.models"
import { selectCurrentConversationAgentSessionsData } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.selectors"
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

  const agentSessions = useAppSelector(selectCurrentConversationAgentSessionsData)

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
  agentSessions: ConversationAgentSession[]
  organizationId: string
  projectId: string
}) {
  const { t } = useTranslation()
  const { getPath } = useGetPath()
  const outlet = useOutlet()

  if (outlet) return <Outlet />
  return (
    <ListHeader path={getPath("agent")} title={t("conversationAgentSession:list.title")}>
      <ConversationAgentSessionCreator
        type="button"
        ids={{ organizationId, projectId, agentId: agent.id }}
      />

      {agentSessions.map((agentSession) => (
        <ConversationAgentSessionItem
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
