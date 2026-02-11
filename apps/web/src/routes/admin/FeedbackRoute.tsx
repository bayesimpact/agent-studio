import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { EmptyFeedback } from "@/components/agent-message-feedback/EmptyFeedback"
import { FeedbackItem } from "@/components/agent-message-feedback/FeedbackItem"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import type { AgentMessageFeedback } from "@/features/agent-message-feedback/agent-message-feedback.models"
import { selectFeedbacksFromAgentId } from "@/features/agent-message-feedback/agent-message-feedback.selectors"
import type { Agent } from "@/features/agents/agents.models"
import { selectAgentData, selectCurrentAgentId } from "@/features/agents/agents.selectors"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "../LoadingRoute"
import { NotFoundRoute } from "../NotFoundRoute"

export function FeedbackRoute() {
  const agentId = useAppSelector(selectCurrentAgentId)
  const agent = useAppSelector(selectAgentData)
  const feedbacksData = useAppSelector(selectFeedbacksFromAgentId(agentId))
  if (!agentId) return <NotFoundRoute />

  if (ADS.isError(feedbacksData) || ADS.isError(agent)) return <NotFoundRoute />

  if (ADS.isFulfilled(feedbacksData) && ADS.isFulfilled(agent))
    return <WithData agent={agent.value} feedbacks={feedbacksData.value} />

  return <LoadingRoute />
}

function WithData({ feedbacks, agent }: { feedbacks: AgentMessageFeedback[]; agent: Agent }) {
  useHandleHeader({ agent })
  return (
    <div className="p-6">
      {feedbacks.length === 0 ? (
        <EmptyFeedback agent={agent} />
      ) : (
        <div className="grid grid-cols-1 divide-y-4 divide-gray-100">
          {feedbacks.map((feedback) => (
            <FeedbackItem key={feedback.id} feedback={feedback} />
          ))}
        </div>
      )}
    </div>
  )
}

function useHandleHeader({ agent }: { agent: Agent }) {
  const { t } = useTranslation("feedbacks", { keyPrefix: "header" })
  const { setHeaderTitle, setHeaderRightSlot } = useSidebarLayout()
  const headerTitle = t("title", { agentName: agent.name })

  useEffect(() => {
    setHeaderTitle(headerTitle)
    setHeaderRightSlot(undefined)
    return () => {
      setHeaderTitle("")
      setHeaderRightSlot(undefined)
    }
  }, [headerTitle, setHeaderTitle, setHeaderRightSlot])
}
