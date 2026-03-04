import { selectCurrentAgentData } from "@/features/agents/agents.selectors"
import type { ConversationAgentSession } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.models"
import { selectCurrentConversationAgentSessionData } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.selectors"
import { selectCurrentFormAgentSessionData } from "@/features/agents/form-agent-sessions/form-agent-sessions.selectors"
import type { AgentSessionMessage } from "@/features/agents/shared/agent-session-messages/agent-session-messages.models"
import { selectCurrentMessagesData } from "@/features/agents/shared/agent-session-messages/agent-session-messages.selectors"
import { AgentSessionMessages } from "@/features/agents/shared/agent-session-messages/components/AgentSessionMessages"
import { useAbility } from "@/hooks/use-ability"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { ErrorRoute } from "../ErrorRoute"
import { LoadingRoute } from "../LoadingRoute"

export function AgentSessionRoute() {
  const agent = useAppSelector(selectCurrentAgentData)
  const agentSession = useAppSelector(
    agent.value?.type === "conversation"
      ? selectCurrentConversationAgentSessionData
      : selectCurrentFormAgentSessionData,
  )
  const messages = useAppSelector(selectCurrentMessagesData)

  if (ADS.isError(agentSession) || ADS.isError(messages))
    return <ErrorRoute error={agentSession.error || messages.error || "Unknown error"} />

  if (ADS.isFulfilled(agentSession) && ADS.isFulfilled(messages)) {
    return <WithData agentSession={agentSession.value} messages={messages.value} />
  }

  return <LoadingRoute />
}

function WithData({
  agentSession,
  messages,
}: {
  agentSession: ConversationAgentSession
  messages: AgentSessionMessage[]
}) {
  const { isAdminInterface } = useAbility()
  return (
    <AgentSessionMessages
      isAdminInterface={isAdminInterface}
      session={agentSession}
      messages={messages}
    />
  )
}
