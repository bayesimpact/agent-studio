import { useEffect } from "react"
import { EmptyFeedback } from "@/components/agent-message-feedback/EmptyFeedback"
import { FeedbackItem } from "@/components/agent-message-feedback/FeedbackItem"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import type { AgentMessageFeedback } from "@/features/agent-message-feedback/agent-message-feedback.models"
import { selectFeedbacksFromAgentId } from "@/features/agent-message-feedback/agent-message-feedback.selectors"
import type { Agent } from "@/features/agents/agents.models"
import { selectAgentData, selectCurrentAgentId } from "@/features/agents/agents.selectors"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { ErrorRoute } from "../ErrorRoute"
import { LoadingRoute } from "../LoadingRoute"

export function FeedbackRoute() {
  const agentId = useAppSelector(selectCurrentAgentId)
  const agent = useAppSelector(selectAgentData)
  const feedbacksData = useAppSelector(selectFeedbacksFromAgentId(agentId))
  if (!agentId) return <ErrorRoute error="Missing valid agent ID" />

  if (ADS.isError(feedbacksData) || ADS.isError(agent))
    return <ErrorRoute error={feedbacksData.error || agent.error || "Unknown error"} />

  if (ADS.isFulfilled(feedbacksData) && ADS.isFulfilled(agent))
    return <WithData agent={agent.value} feedbacks={feedbacksData.value} />

  return <LoadingRoute />
}

function WithData({ feedbacks, agent }: { feedbacks: AgentMessageFeedback[]; agent: Agent }) {
  useHandleHeader()
  return (
    <div className="p-6">
      {feedbacks.length === 0 ? (
        <EmptyFeedback agent={agent} />
      ) : (
        <div className="grid grid-cols-1 divide-y-4 divide-muted">
          {feedbacks.map((feedback) => (
            <FeedbackItem key={feedback.id} feedback={feedback} />
          ))}
        </div>
      )}
    </div>
  )
}

function useHandleHeader() {
  const { setHeaderRightSlot } = useSidebarLayout()

  useEffect(() => {
    setHeaderRightSlot(undefined)
    return () => {
      setHeaderRightSlot(undefined)
    }
  }, [setHeaderRightSlot])
}
