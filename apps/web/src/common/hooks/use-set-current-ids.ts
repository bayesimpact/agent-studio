import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { currentAgentSessionIdActions } from "@/common/features/agents/agent-sessions/current-agent-session-id/current-agent-session-id.slice"
import { agentsActions } from "@/common/features/agents/agents.slice"
import { organizationsActions } from "@/common/features/organizations/organizations.slice"
import { projectsActions } from "@/common/features/projects/projects.slice"
import { currentReviewCampaignIdActions } from "@/common/features/review-campaigns/current-review-campaign-id/current-review-campaign-id.slice"
import { currentReviewerSessionIdActions } from "@/common/features/review-campaigns/current-reviewer-session-id/current-reviewer-session-id.slice"
import { useAppDispatch } from "@/common/store/hooks"

export const useSetCurrentIds = () => {
  const dispatch = useAppDispatch()
  const params = useParams()
  useEffect(() => {
    const { organizationId, projectId, agentId, agentSessionId, reviewCampaignId, sessionId } =
      params

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

    dispatch(
      currentReviewCampaignIdActions.setCurrentReviewCampaignId({
        reviewCampaignId: reviewCampaignId || null,
      }),
    )

    // Reviewer URL exposes the agent session id under :sessionId (no :agentId).
    // Reuse the same Redux slot regardless of whether you hit the tester
    // (:agentSessionId) or reviewer (:sessionId) param.
    dispatch(
      currentReviewerSessionIdActions.setCurrentReviewerSessionId({
        reviewerSessionId: sessionId || null,
      }),
    )
  }, [dispatch, params])
}
