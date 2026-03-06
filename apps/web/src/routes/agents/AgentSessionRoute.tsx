import type { Agent } from "@/features/agents/agents.models"
import { selectCurrentAgentData } from "@/features/agents/agents.selectors"
import type { ConversationAgentSession } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.models"
import { selectCurrentConversationAgentSessionData } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.selectors"
import { FormResult } from "@/features/agents/form-agent-sessions/components/FormResult"
import type { FormAgentSession } from "@/features/agents/form-agent-sessions/form-agent-sessions.models"
import { selectCurrentFormAgentSessionData } from "@/features/agents/form-agent-sessions/form-agent-sessions.selectors"
import type { AgentSessionMessage } from "@/features/agents/shared/agent-session-messages/agent-session-messages.models"
import { selectCurrentMessagesData } from "@/features/agents/shared/agent-session-messages/agent-session-messages.selectors"
import { AgentSessionMessages } from "@/features/agents/shared/agent-session-messages/components/AgentSessionMessages"
import { useAbility } from "@/hooks/use-ability"
import { useAppSelector } from "@/store/hooks"
import { AsyncRoute } from "../AsyncRoute"
import { ErrorRoute } from "../ErrorRoute"

export function AgentSessionRoute() {
  const agent = useAppSelector(selectCurrentAgentData)
  const messages = useAppSelector(selectCurrentMessagesData)

  return (
    <AsyncRoute data={[agent, messages]}>
      {([agentValue, messagesValue]) => {
        switch (agentValue.type) {
          case "conversation":
            return <ConversationAgentSessionRoute agent={agentValue} messages={messagesValue} />
          case "form":
            return <FormAgentSessionRoute agent={agentValue} messages={messagesValue} />
          default:
            return <ErrorRoute error={"Unknown agent type"} />
        }
      }}
    </AsyncRoute>
  )
}

function ConversationAgentSessionRoute({
  agent,
  messages,
}: {
  agent: Agent
  messages: AgentSessionMessage[]
}) {
  const agentSession = useAppSelector(selectCurrentConversationAgentSessionData)

  return (
    <AsyncRoute data={[agentSession]}>
      {([agentSessionValue]) => (
        <WithData agent={agent} agentSession={agentSessionValue} messages={messages} />
      )}
    </AsyncRoute>
  )
}

function FormAgentSessionRoute({
  agent,
  messages,
}: {
  agent: Agent
  messages: AgentSessionMessage[]
}) {
  const agentSession = useAppSelector(selectCurrentFormAgentSessionData)

  return (
    <AsyncRoute data={[agentSession]}>
      {([agentSessionValue]) => (
        <WithData agent={agent} agentSession={agentSessionValue} messages={messages} />
      )}
    </AsyncRoute>
  )
}

function WithData({
  agentSession,
  messages,
  agent,
}: {
  agent: Agent
  agentSession: ConversationAgentSession | FormAgentSession
  messages: AgentSessionMessage[]
}) {
  const { isAdminInterface } = useAbility()
  return (
    <AgentSessionMessages
      isAdminInterface={isAdminInterface}
      session={agentSession}
      messages={messages}
      rightSlot={
        agent.type === "form" ? <FormResult agent={agent} agentSession={agentSession} /> : undefined
      }
    />
  )
}
