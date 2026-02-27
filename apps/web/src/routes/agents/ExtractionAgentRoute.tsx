import { useTranslation } from "react-i18next"
import { ListHeader } from "@/components/layouts/ListHeader"
import type { AgentExtractionRunSummary } from "@/features/agent-extraction-runs/agent-extraction-runs.models"
import { selectAgentExtractionRunsFromAgentId } from "@/features/agent-extraction-runs/agent-extraction-runs.selectors"
import { ExtractionCreator } from "@/features/agent-extraction-runs/components/ExtractionCreator"
import { ExtractionRunItem } from "@/features/agent-extraction-runs/components/ExtractionRunItem"
import type { Agent } from "@/features/agents/agents.models"
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
  const runsData = useAppSelector(selectAgentExtractionRunsFromAgentId(agent.id))

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
  runs: AgentExtractionRunSummary[]
}) {
  const { buildPath } = useBuildPath()
  const { t } = useTranslation("agentExtractionRun", { keyPrefix: "list" })

  return (
    <ListHeader path={buildPath("project", { organizationId, projectId })} title={t("title")}>
      {runs.map((run) => (
        <ExtractionRunItem key={run.id} run={run} />
      ))}

      <ExtractionCreator />
    </ListHeader>
  )
}
