import { useTranslation } from "react-i18next"
import type { AgentSession } from "@/features/agent-sessions/agent-sessions.models"
import { useGetPath } from "@/hooks/use-build-path"
import { ListHeader } from "../layouts/ListHeader"
import { AgentSessionCreator } from "./AgentSessionCreator"
import { AgentSessionItem } from "./AgentSessionItem"

export function AgentSessionList({
  organizationId,
  projectId,
  agentId,
  agentSessions,
}: {
  organizationId: string
  projectId: string
  agentId: string
  agentSessions: AgentSession[]
}) {
  const { t } = useTranslation()
  const { getPath } = useGetPath()
  return (
    <ListHeader path={getPath("agent")} title={t("agentSession:list.title")}>
      {agentSessions.map((agentSession) => (
        <AgentSessionItem
          key={agentSession.id}
          organizationId={organizationId}
          projectId={projectId}
          agentId={agentId}
          agentSession={agentSession}
        />
      ))}

      <AgentSessionCreator
        type="button"
        organizationId={organizationId}
        projectId={projectId}
        agentId={agentId}
      />
    </ListHeader>
  )
}
