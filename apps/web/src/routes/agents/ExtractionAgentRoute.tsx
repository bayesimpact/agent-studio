import { useTranslation } from "react-i18next"
import { ListHeader } from "@/components/layouts/ListHeader"
import type { Agent } from "@/features/agents/agents.models"
import { ExtractionSessionCreator } from "@/features/agents/extraction-agent-sessions/components/ExtractionAgentSessionCreator"
import { ExtractionSessionItem } from "@/features/agents/extraction-agent-sessions/components/ExtractionAgentSessionItem"
import type { ExtractionAgentSessionSummary } from "@/features/agents/extraction-agent-sessions/extraction-agent-sessions.models"
import { selectExtractionAgentSessionsFromAgentId } from "@/features/agents/extraction-agent-sessions/extraction-agent-sessions.selectors"
import { useBuildPath } from "@/hooks/use-build-path"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { ErrorRoute } from "../ErrorRoute"
import { LoadingRoute } from "../LoadingRoute"
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
  const runsData = useAppSelector(selectExtractionAgentSessionsFromAgentId(agent.id))

  if (ADS.isError(runsData)) return <ErrorRoute error={runsData.error || "Unknown error"} />
  if (ADS.isFulfilled(runsData)) {
    return (
      <ExtractionAgentWithData
        organizationId={organizationId}
        projectId={projectId}
        runs={runsData.value}
      />
    )
  }
  return <LoadingRoute />
}

function ExtractionAgentWithData({
  organizationId,
  projectId,
  runs,
}: {
  organizationId: string
  projectId: string
  runs: ExtractionAgentSessionSummary[]
}) {
  const { buildPath } = useBuildPath()
  const { t } = useTranslation("extractionAgentSession", { keyPrefix: "list" })

  return (
    <ListHeader path={buildPath("project", { organizationId, projectId })} title={t("title")}>
      <ExtractionSessionCreator />

      {runs.map((run) => (
        <ExtractionSessionItem key={run.id} run={run} />
      ))}
    </ListHeader>
  )
}
