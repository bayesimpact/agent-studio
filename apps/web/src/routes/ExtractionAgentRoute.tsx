import { useTranslation } from "react-i18next"
import { Navigate } from "react-router-dom"
import { ListHeader } from "@/components/layouts/ListHeader"
import type { AgentExtractionRunSummary } from "@/features/agent-extraction-runs/agent-extraction-runs.models"
import { selectAgentExtractionRunsFromAgentId } from "@/features/agent-extraction-runs/agent-extraction-runs.selectors"
import { ExtractionCreator } from "@/features/agent-extraction-runs/components/ExtractionCreator"
import { ExtractionRunItem } from "@/features/agent-extraction-runs/components/ExtractionRunItem"
import {
  selectAgentDataFromAgentId,
  selectCurrentAgentId,
} from "@/features/agents/agents.selectors"
import { selectCurrentOrganizationId } from "@/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/features/projects/projects.selectors"
import { useBuildPath } from "@/hooks/use-build-path"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { ErrorRoute } from "./ErrorRoute"
import { LoadingRoute } from "./LoadingRoute"

export function ExtractionAgentRoute() {
  const { buildPath } = useBuildPath()
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)
  const agentId = useAppSelector(selectCurrentAgentId)
  const agent = useAppSelector(selectAgentDataFromAgentId(agentId))
  const runsData = useAppSelector(selectAgentExtractionRunsFromAgentId(agentId))

  if (ADS.isError(runsData) || ADS.isError(agent) || !organizationId || !projectId)
    return <ErrorRoute error={runsData.error || agent.error || "Unknown error"} />

  if (ADS.isFulfilled(agent) && ADS.isFulfilled(runsData)) {
    if (agent.value.type !== "extraction") {
      return (
        <Navigate
          to={buildPath("agent", {
            organizationId,
            projectId,
            agentId: agent.value.id,
          })}
          replace
        />
      )
    }
    return <WithData organizationId={organizationId} runs={runsData.value} projectId={projectId} />
  }

  return <LoadingRoute />
}

function WithData({
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
