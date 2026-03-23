import { useTranslation } from "react-i18next"
import { Outlet, useOutlet } from "react-router-dom"
import { ListHeader } from "@/components/layouts/ListHeader"
import type { Agent } from "@/features/agents/agents.models"
import { ConversationAgentSessionCreator } from "@/features/agents/conversation-agent-sessions/components/ConversationAgentSessionCreator"
import { ConversationAgentSessionItem } from "@/features/agents/conversation-agent-sessions/components/ConversationAgentSessionItem"
import type { ConversationAgentSession } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.models"
import { selectCurrentConversationAgentSessionsData } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.selectors"
import { useGetPath } from "@/hooks/use-build-path"
import { useAppSelector } from "@/store/hooks"
import { AsyncRoute } from "../AsyncRoute"
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

  return (
    <AsyncRoute data={[agentSessions]}>
      {([agentSessionsValue]) => (
        <WithData
          agentSessions={agentSessionsValue}
          agent={agent}
          organizationId={organizationId}
          projectId={projectId}
        />
      )}
    </AsyncRoute>
  )
}

function WithData({
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
    <ListHeader
      path={getPath("agent")}
      title={t("conversationAgentSession:list.title")}
      agent={agent}
    >
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
