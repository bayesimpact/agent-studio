import type { ConversationAgentSession } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.models"
import { selectCurrentConversationAgentSessionsData } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.selectors"
import { useAppSelector } from "@/store/hooks"
import { AsyncRoute } from "../AsyncRoute"

export function ConversationAgentRoute({
  children,
}: {
  children: (agentSessions: ConversationAgentSession[]) => React.ReactNode
}) {
  const agentSessions = useAppSelector(selectCurrentConversationAgentSessionsData)

  return (
    <AsyncRoute data={[agentSessions]}>
      {([agentSessionsValue]) => children(agentSessionsValue)}
    </AsyncRoute>
  )
}
