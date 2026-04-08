import { useAppSelector } from "@/common/store/hooks"
import type { ConversationAgentSession } from "@/features/agents/agent-sessions/conversation/conversation-agent-sessions.models"
import { selectCurrentConversationAgentSessionsData } from "@/features/agents/agent-sessions/conversation/conversation-agent-sessions.selectors"
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
