import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { agentsActions } from "@/common/features/agents/agents.slice"
import { organizationsActions } from "@/common/features/organizations/organizations.slice"
import { projectsActions } from "@/common/features/projects/projects.slice"
import { useAppDispatch } from "@/common/store/hooks"
import { currentAgentSessionIdActions } from "@/features/agents/agent-sessions/current-agent-session-id/current-agent-session-id.slice"

export const useSetCurrentIds = () => {
  const dispatch = useAppDispatch()
  const params = useParams()
  useEffect(() => {
    const { organizationId, projectId, agentId, agentSessionId } = params

    dispatch(
      organizationsActions.setCurrentOrganizationId({ organizationId: organizationId || null }),
    )

    dispatch(projectsActions.setCurrentProjectId({ projectId: projectId || null }))

    dispatch(agentsActions.setCurrentAgentId({ agentId: agentId || null }))

    dispatch(
      currentAgentSessionIdActions.setCurrentAgentSessionId({
        agentSessionId: agentSessionId || null,
      }),
    )
  }, [dispatch, params])
}
