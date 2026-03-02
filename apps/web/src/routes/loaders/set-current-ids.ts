import { useEffect } from "react"
import type { Params } from "react-router-dom"
import { agentsActions } from "@/features/agents/agents.slice"
import { conversationAgentSessionsActions } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.slice"
import { organizationsActions } from "@/features/organizations/organizations.slice"
import { projectsActions } from "@/features/projects/projects.slice"
import type { AppDispatch } from "@/store"

export const setCurrentIds = ({
  dispatch,
  params,
}: {
  dispatch: AppDispatch
  params: Params<string>
}) => {
  const { organizationId, projectId, agentId, agentSessionId } = params

  useEffect(() => {
    dispatch(
      organizationsActions.setCurrentOrganizationId({ organizationId: organizationId || null }),
    )

    dispatch(projectsActions.setCurrentProjectId({ projectId: projectId || null }))

    dispatch(agentsActions.setCurrentAgentId({ agentId: agentId || null }))

    dispatch(
      conversationAgentSessionsActions.setCurrentAgentSessionId({
        agentSessionId: agentSessionId || null,
      }),
    )
  }, [dispatch, organizationId, projectId, agentId, agentSessionId])
}
