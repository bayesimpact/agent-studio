import { useTranslation } from "react-i18next"
import { Outlet, useOutlet } from "react-router-dom"
import { ListHeader } from "@/components/layouts/ListHeader"
import type { Agent } from "@/features/agents/agents.models"
import { FormAgentSessionCreator } from "@/features/agents/form-agent-sessions/components/FormAgentSessionCreator"
import { FormAgentSessionItem } from "@/features/agents/form-agent-sessions/components/FormAgentSessionItem"
import type { FormAgentSession } from "@/features/agents/form-agent-sessions/form-agent-sessions.models"
import { selectCurrentFormAgentSessionsData } from "@/features/agents/form-agent-sessions/form-agent-sessions.selectors"
import { useGetPath } from "@/hooks/use-build-path"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { ErrorRoute } from "../ErrorRoute"
import { LoadingRoute } from "../LoadingRoute"
import { useHandleHeader } from "./Header"

export function FormAgentRoute({
  agent,
  organizationId,
  projectId,
}: {
  agent: Agent
  organizationId: string
  projectId: string
}) {
  useHandleHeader(agent)

  const agentSessions = useAppSelector(selectCurrentFormAgentSessionsData)

  if (ADS.isError(agentSessions))
    return <ErrorRoute error={agentSessions.error || "Unknown error"} />
  if (ADS.isFulfilled(agentSessions)) {
    return (
      <FormAgentWithData
        agentSessions={agentSessions.value}
        agent={agent}
        organizationId={organizationId}
        projectId={projectId}
      />
    )
  }
  return <LoadingRoute />
}

function FormAgentWithData({
  agent,
  agentSessions,
  organizationId,
  projectId,
}: {
  agent: Agent
  agentSessions: FormAgentSession[]
  organizationId: string
  projectId: string
}) {
  const { t } = useTranslation()
  const { getPath } = useGetPath()
  const outlet = useOutlet()

  if (outlet) return <Outlet />
  return (
    <ListHeader path={getPath("agent")} title={t("formAgentSession:list.title")}>
      <FormAgentSessionCreator
        type="button"
        organizationId={organizationId}
        projectId={projectId}
        agentId={agent.id}
      />

      {agentSessions.map((agentSession) => (
        <FormAgentSessionItem
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
