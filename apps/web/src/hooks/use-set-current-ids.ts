import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { agentsActions } from "@/features/agents/agents.slice"
import { currentAgentSessionIdActions } from "@/features/agents/current-agent-session-id/current-agent-session-id.slice"
import { organizationsActions } from "@/features/organizations/organizations.slice"
import { projectsActions } from "@/features/projects/projects.slice"
import { useAppDispatch } from "@/store/hooks"

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
