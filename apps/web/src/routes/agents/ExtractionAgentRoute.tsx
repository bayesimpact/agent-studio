import { useTranslation } from "react-i18next"
import { Outlet, useOutlet } from "react-router-dom"
import { ListHeader } from "@/components/layouts/ListHeader"
import type { Agent } from "@/features/agents/agents.models"
import { ExtractionSessionCreator } from "@/features/agents/extraction-agent-sessions/components/ExtractionAgentSessionCreator"
import { ExtractionSessionItem } from "@/features/agents/extraction-agent-sessions/components/ExtractionAgentSessionItem"
import type { ExtractionAgentSessionSummary } from "@/features/agents/extraction-agent-sessions/extraction-agent-sessions.models"
import { selectExtractionAgentSessionsFromAgentId } from "@/features/agents/extraction-agent-sessions/extraction-agent-sessions.selectors"
import { useBuildPath } from "@/hooks/use-build-path"
import { useAppSelector } from "@/store/hooks"
import { AsyncRoute } from "../AsyncRoute"
import { useHandleHeader } from "./Header"

export function ExtractionAgentRoute({
  agent,
  organizationId,
  projectId,
}: {
  agent: Agent
  organizationId: string
  projectId: string
}) {
  useHandleHeader(agent)
  const agentSessions = useAppSelector(selectExtractionAgentSessionsFromAgentId(agent.id))

  return (
    <AsyncRoute data={[agentSessions]}>
      {([agentSessionsValue]) => (
        <WithData
          agent={agent}
          organizationId={organizationId}
          projectId={projectId}
          agentSessions={agentSessionsValue}
        />
      )}
    </AsyncRoute>
  )
}

function WithData({
  agent,
  organizationId,
  projectId,
  agentSessions,
}: {
  agent: Agent
  organizationId: string
  projectId: string
  agentSessions: ExtractionAgentSessionSummary[]
}) {
  const outlet = useOutlet()
  const { buildPath } = useBuildPath()
  const { t } = useTranslation("extractionAgentSession", { keyPrefix: "list" })

  if (outlet) return <Outlet />
  return (
    <ListHeader
      agent={agent}
      path={buildPath("project", { organizationId, projectId })}
      title={t("title")}
    >
      <ExtractionSessionCreator />

      {agentSessions.map((run) => (
        <ExtractionSessionItem key={run.id} run={run} />
      ))}
    </ListHeader>
  )
}
