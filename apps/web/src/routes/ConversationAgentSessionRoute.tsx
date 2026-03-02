import { ConversationAgentSession } from "@/features/agents/conversation-agent-sessions/components/ConversationAgentSession"
import type {
  ConversationAgentSessionMessage,
  ConversationAgentSession as ConversationAgentSessionType,
} from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.models"
import {
  selectCurrentConversationAgentSessionData,
  selectCurrentMessagesData,
} from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.selectors"
import { useAbility } from "@/hooks/use-ability"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { ErrorRoute } from "./ErrorRoute"
import { LoadingRoute } from "./LoadingRoute"

export function ConversationAgentSessionRoute() {
  const agentSession = useAppSelector(selectCurrentConversationAgentSessionData)
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
  agentSession: ConversationAgentSessionType
  messages: ConversationAgentSessionMessage[]
}) {
  const { isAdminInterface } = useAbility()
  return (
    <ConversationAgentSession
      isAdminInterface={isAdminInterface}
      session={agentSession}
      messages={messages}
    />
  )
}
