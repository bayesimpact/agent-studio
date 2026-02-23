import {
  Item,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemTitle,
} from "@caseai-connect/ui/shad/item"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Navigate, useParams } from "react-router-dom"
import { ListHeader } from "@/components/layouts/ListHeader"
import type { AgentExtractionRunSummary } from "@/features/agent-extraction-runs/agent-extraction-runs.models"
import { selectAgentExtractionRunsFromAgentId } from "@/features/agent-extraction-runs/agent-extraction-runs.selectors"
import { listAgentExtractionRuns } from "@/features/agent-extraction-runs/agent-extraction-runs.thunks"
import type { Agent } from "@/features/agents/agents.models"
import { selectAgentDataFromAgentId } from "@/features/agents/agents.selectors"
import { selectCurrentOrganizationId } from "@/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/features/projects/projects.selectors"
import { useBuildPath } from "@/hooks/use-build-path"
import { ADS } from "@/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { buildDate } from "@/utils/build-date"
import { ErrorRoute } from "./ErrorRoute"
import { LoadingRoute } from "./LoadingRoute"

export function ExtractionAgentRoute() {
  const { agentId: urlAgentId } = useParams()
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)
  const agent = useAppSelector(selectAgentDataFromAgentId(urlAgentId))

  if (ADS.isError(agent) || !organizationId || !projectId) {
    return <ErrorRoute error={agent.error || "Unknown error"} />
  }

  if (!ADS.isFulfilled(agent)) return <LoadingRoute />

  return <WithData organizationId={organizationId} projectId={projectId} agent={agent.value} />
}

function WithData({
  organizationId,
  projectId,
  agent,
}: {
  organizationId: string
  projectId: string
  agent: Agent
}) {
  const dispatch = useAppDispatch()
  const { buildPath } = useBuildPath()
  const { t } = useTranslation("agentExtractionRun")
  const runsData = useAppSelector(selectAgentExtractionRunsFromAgentId(agent.id))

  useEffect(() => {
    dispatch(listAgentExtractionRuns({ organizationId, projectId, agentId: agent.id }))
  }, [agent.id, dispatch, organizationId, projectId])

  if (agent.type !== "extraction") {
    return (
      <Navigate
        to={buildPath("agent", {
          organizationId,
          projectId,
          agentId: agent.id,
        })}
        replace
      />
    )
  }

  if (ADS.isError(runsData)) {
    return <ErrorRoute error={runsData.error || "Unknown error"} />
  }

  if (!ADS.isFulfilled(runsData)) {
    return <LoadingRoute />
  }

  const runs = runsData.value

  return (
    <ListHeader path={buildPath("project", { organizationId, projectId })} title={t("list.title")}>
      {runs.length === 0 ? (
        <Item variant="outline" className="min-w-96 w-fit">
          <ItemHeader>
            <ItemTitle>{t("list.empty.title")}</ItemTitle>
            <ItemDescription>{t("list.empty.description")}</ItemDescription>
          </ItemHeader>
        </Item>
      ) : (
        runs.map((run) => <ExtractionRunItem key={run.id} run={run} />)
      )}
    </ListHeader>
  )
}

function ExtractionRunItem({ run }: { run: AgentExtractionRunSummary }) {
  const { t } = useTranslation("agentExtractionRun")
  return (
    <Item variant="outline" className="min-w-96 w-fit">
      <ItemHeader>
        <ItemTitle>{buildDate(run.createdAt)}</ItemTitle>
        <ItemDescription>{t(`status.${run.status}`)}</ItemDescription>
      </ItemHeader>
      <ItemContent>{run.id}</ItemContent>
    </Item>
  )
}
