import { Outlet } from "react-router-dom"
import { selectCurrentAgentSessionId } from "@/common/features/agents/agent-sessions/current-agent-session-id/current-agent-session-id.selectors"
import { selectCurrentMessagesData } from "@/common/features/agents/agent-sessions/shared/agent-session-messages/agent-session-messages.selectors"
import { useMount } from "@/common/hooks/use-mount"
import { AsyncRoute } from "@/common/routes/AsyncRoute"
import { LoadingRoute } from "@/common/routes/LoadingRoute"
import { useAppSelector } from "@/common/store/hooks"
import { reviewCampaignsTesterActions } from "../features/review-campaigns/tester.slice"

export function TesterSessionRoute() {
  const agentSessionId = useAppSelector(selectCurrentAgentSessionId)
  const messagesData = useAppSelector(selectCurrentMessagesData)

  useMount({
    actions: {
      mount: reviewCampaignsTesterActions.sessionMount,
      unmount: reviewCampaignsTesterActions.sessionUnmount,
    },
    condition: !!agentSessionId,
  })

  if (!agentSessionId) return <LoadingRoute />
  return <AsyncRoute data={[messagesData]}>{() => <Outlet />}</AsyncRoute>
}
