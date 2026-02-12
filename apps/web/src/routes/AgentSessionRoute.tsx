import { AdminAgentSession, AppAgentSession } from "@/components/agents/AgentSession"
import type {
  AgentSession,
  AgentSessionMessage,
} from "@/features/agent-sessions/agent-sessions.models"
import {
  selectCurrentAgentSessionData,
  selectCurrentMessagesData,
} from "@/features/agent-sessions/agent-sessions.selectors"
import { useAbility } from "@/hooks/use-ability"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "./LoadingRoute"
import { NotFoundRoute } from "./NotFoundRoute"

export function AgentSessionRoute() {
  const agentSession = useAppSelector(selectCurrentAgentSessionData)
  const messages = useAppSelector(selectCurrentMessagesData)

  if (ADS.isError(agentSession) || ADS.isError(messages)) return <NotFoundRoute />

  if (ADS.isFulfilled(agentSession) && ADS.isFulfilled(messages)) {
    return <WithData agentSession={agentSession.value} messages={messages.value} />
  }

  return <LoadingRoute />
}

function WithData({
  agentSession,
  messages,
}: {
  agentSession: AgentSession
  messages: AgentSessionMessage[]
}) {
  const { isAdminInterface } = useAbility()
  if (isAdminInterface) return <AdminAgentSession session={agentSession} messages={messages} />
  return <AppAgentSession session={agentSession} messages={messages} />
}
