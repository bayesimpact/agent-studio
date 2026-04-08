import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { organizationsActions } from "@/common/features/organizations/organizations.slice"
import { useAppDispatch } from "@/common/store/hooks"
import { agentsActions } from "@/features/agents/agents.slice"
import { currentAgentSessionIdActions } from "@/features/agents/current-agent-session-id/current-agent-session-id.slice"
import { projectsActions } from "@/features/projects/projects.slice"

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
