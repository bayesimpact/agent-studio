import { useEffect } from "react"
import { Navigate, Outlet, useOutlet, useParams } from "react-router-dom"
import { AgentDeletorWithTrigger } from "@/components/agent/AgentDeletor"
import { AgentEditorWithTrigger } from "@/components/agent/AgentEditor"
import { DefaultPromptDialog } from "@/components/agent/DefaultPromptDialog"
import { AgentSessionList } from "@/components/agent-session/AgentSessionList"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import type { AgentSession } from "@/features/agent-sessions/agent-sessions.models"
import { selectCurrentAgentSessionsData } from "@/features/agent-sessions/agent-sessions.selectors"
import type { Agent } from "@/features/agents/agents.models"
import { selectAgentDataFromAgentId } from "@/features/agents/agents.selectors"
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

export function AgentRoute() {
  const { agentId: urlAgentId } = useParams()
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)
  const agent = useAppSelector(selectAgentDataFromAgentId(urlAgentId))
  const agentSessions = useAppSelector(selectCurrentAgentSessionsData)

  if (ADS.isError(agent) || ADS.isError(agentSessions) || !organizationId || !projectId)
    return <ErrorRoute error={agent.error || agentSessions.error || "Unknown error"} />

  if (ADS.isFulfilled(agent) && ADS.isFulfilled(agentSessions)) {
    if (agent.value.type !== "conversation")
      return <ErrorRoute error={"Agent is not a conversation agent"} />
    return (
      <WithData
        key={urlAgentId}
        projectId={projectId}
        agent={agent.value}
        agentSessions={agentSessions.value}
        organizationId={organizationId}
      />
    )
  }

  return <LoadingRoute />
}

function WithData({
  agent,
  agentSessions,
  organizationId,
  projectId,
}: {
  agent: Agent
  agentSessions: AgentSession[]
  organizationId: string
  projectId: string
}) {
  const outlet = useOutlet()
  const { buildPath } = useBuildPath()

  useHandleHeader(agent)

  if (agent.type === "extraction") {
    return (
      <Navigate
        to={buildPath("extractionAgent", {
          organizationId,
          projectId,
          agentId: agent.id,
        })}
        replace
      />
    )
  }

  if (outlet) return <Outlet />

  return (
    <AgentSessionList
      organizationId={organizationId}
      projectId={projectId}
      agentId={agent.id}
      agentSessions={agentSessions}
    />
  )
}

function useHandleHeader(agent: Agent) {
  const { isAdminInterface } = useAbility()
  const { setHeaderRightSlot } = useSidebarLayout()
  const { isRoute } = useIsRoute()
  const isAgentRoute = isRoute(RouteNames.AGENT)

  useEffect(() => {
    if (!isAgentRoute) return
    if (isAdminInterface) setHeaderRightSlot(<HeaderRightSlot agent={agent} />)
    return () => {
      setHeaderRightSlot(undefined)
    }
  }, [agent, setHeaderRightSlot, isAdminInterface, isAgentRoute])
}

function HeaderRightSlot({ agent }: { agent: Agent }) {
  const { organizationId } = useParams()
  if (!organizationId) return null
  return (
    <div className="flex items-center gap-2">
      <DefaultPromptDialog buttonProps={{ variant: "outline" }} prompt={agent.defaultPrompt} />

      <AgentEditorWithTrigger agent={agent} />

      <AgentDeletorWithTrigger organizationId={organizationId} agent={agent} />
    </div>
  )
}
