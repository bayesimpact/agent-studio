import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { AgentDeletorWithTrigger } from "@/components/agent/AgentDeletor"
import { AgentEditorWithTrigger } from "@/components/agent/AgentEditor"
import { DefaultPromptDialog } from "@/components/agent/DefaultPromptDialog"
import { ListHeader } from "@/components/layouts/ListHeader"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import type { AgentExtractionRunSummary } from "@/features/agent-extraction-runs/agent-extraction-runs.models"
import { selectAgentExtractionRunsFromAgentId } from "@/features/agent-extraction-runs/agent-extraction-runs.selectors"
import { ExtractionCreator } from "@/features/agent-extraction-runs/components/ExtractionCreator"
import { ExtractionRunItem } from "@/features/agent-extraction-runs/components/ExtractionRunItem"
import type { Agent } from "@/features/agents/agents.models"
import {
  selectAgentDataFromAgentId,
  selectCurrentAgentId,
} from "@/features/agents/agents.selectors"
import { selectCurrentOrganizationId } from "@/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/features/projects/projects.selectors"
import { useAbility } from "@/hooks/use-ability"
import { useBuildPath } from "@/hooks/use-build-path"
import { useIsRoute } from "@/hooks/use-is-route"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { ErrorRoute } from "./ErrorRoute"
import { RouteNames } from "./helpers"
import { LoadingRoute } from "./LoadingRoute"

export function ExtractionAgentRoute() {
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)
  const agentId = useAppSelector(selectCurrentAgentId)
  const agent = useAppSelector(selectAgentDataFromAgentId(agentId))
  const runsData = useAppSelector(selectAgentExtractionRunsFromAgentId(agentId))

  if (ADS.isError(runsData) || ADS.isError(agent) || !organizationId || !projectId)
    return <ErrorRoute error={runsData.error || agent.error || "Unknown error"} />

  if (ADS.isFulfilled(agent) && ADS.isFulfilled(runsData)) {
    if (agent.value.type !== "extraction")
      return <ErrorRoute error={"Agent is not an extraction agent"} />
    return (
      <WithData
        organizationId={organizationId}
        runs={runsData.value}
        projectId={projectId}
        agent={agent.value}
      />
    )
  }

  return <LoadingRoute />
}

function WithData({
  organizationId,
  projectId,
  runs,
  agent,
}: {
  agent: Agent
  organizationId: string
  projectId: string
  runs: AgentExtractionRunSummary[]
}) {
  const { buildPath } = useBuildPath()
  const { t } = useTranslation("agentExtractionRun", { keyPrefix: "list" })

  useHandleHeader(agent)

  return (
    <ListHeader path={buildPath("project", { organizationId, projectId })} title={t("title")}>
      {runs.map((run) => (
        <ExtractionRunItem key={run.id} run={run} />
      ))}

      <ExtractionCreator />
    </ListHeader>
  )
}

function useHandleHeader(agent: Agent) {
  const { isAdminInterface } = useAbility()
  const { setHeaderRightSlot } = useSidebarLayout()
  const { isRoute } = useIsRoute()
  const isAgentRoute = isRoute(RouteNames.EXTRACTION_AGENT)

  useEffect(() => {
    if (!isAgentRoute) return
    if (isAdminInterface) setHeaderRightSlot(<HeaderRightSlot agent={agent} />)
    return () => {
      setHeaderRightSlot(undefined)
    }
  }, [agent, setHeaderRightSlot, isAdminInterface, isAgentRoute])
}

function HeaderRightSlot({ agent }: { agent: Agent }) {
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  if (!organizationId) return null
  return (
    <div className="flex items-center gap-2">
      <DefaultPromptDialog buttonProps={{ variant: "outline" }} prompt={agent.defaultPrompt} />

      <AgentEditorWithTrigger agent={agent} />

      <AgentDeletorWithTrigger organizationId={organizationId} agent={agent} />
    </div>
  )
}
