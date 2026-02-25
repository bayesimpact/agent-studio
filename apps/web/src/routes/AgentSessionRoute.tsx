import { AgentSession } from "@/components/agent/AgentSession"
import type {
  AgentSessionMessage,
  AgentSession as AgentSessionType,
} from "@/features/agent-sessions/agent-sessions.models"
import {
  selectCurrentAgentSessionData,
  selectCurrentMessagesData,
} from "@/features/agent-sessions/agent-sessions.selectors"
import { useAbility } from "@/hooks/use-ability"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { ErrorRoute } from "./ErrorRoute"
import { LoadingRoute } from "./LoadingRoute"

export function AgentSessionRoute() {
  const agentSession = useAppSelector(selectCurrentAgentSessionData)
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
  agentSession: AgentSessionType
  messages: AgentSessionMessage[]
}) {
  const { isAdminInterface } = useAbility()
  return (
    <AgentSession isAdminInterface={isAdminInterface} session={agentSession} messages={messages} />
  )
}
