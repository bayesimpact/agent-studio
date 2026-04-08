import type { ConversationAgentSession } from "@/common/features/agents/agent-sessions/conversation/conversation-agent-sessions.models"
import { selectCurrentConversationAgentSessionData } from "@/common/features/agents/agent-sessions/conversation/conversation-agent-sessions.selectors"
import type { FormAgentSession } from "@/common/features/agents/agent-sessions/form/form-agent-sessions.models"
import { selectCurrentFormAgentSessionData } from "@/common/features/agents/agent-sessions/form/form-agent-sessions.selectors"
import type { AgentSessionMessage } from "@/common/features/agents/agent-sessions/shared/agent-session-messages/agent-session-messages.models"
import { selectCurrentMessagesData } from "@/common/features/agents/agent-sessions/shared/agent-session-messages/agent-session-messages.selectors"
import type { Agent } from "@/common/features/agents/agents.models"
import { selectCurrentAgentData } from "@/common/features/agents/agents.selectors"
import { useAppSelector } from "@/common/store/hooks"
import { AsyncRoute } from "../AsyncRoute"
import { ErrorRoute } from "../ErrorRoute"

type AgentSession = ConversationAgentSession | FormAgentSession
export function AgentSessionRoute({
  children,
}: {
  children: (
    agent: Agent,
    agentSession: AgentSession,
    messages: AgentSessionMessage[],
  ) => React.ReactNode
}) {
  const agent = useAppSelector(selectCurrentAgentData)
  const messages = useAppSelector(selectCurrentMessagesData)

  return (
    <AsyncRoute data={[agent, messages]}>
      {([agentValue, messagesValue]) => {
        switch (agentValue.type) {
          case "conversation":
            return (
              <ConversationAgentSessionRoute agent={agentValue} messages={messagesValue}>
                {(agent, agentSession, messages) => children(agent, agentSession, messages)}
              </ConversationAgentSessionRoute>
            )
          case "form":
            return (
              <FormAgentSessionRoute agent={agentValue} messages={messagesValue}>
                {(agent, agentSession, messages) => children(agent, agentSession, messages)}
              </FormAgentSessionRoute>
            )
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
  children,
}: {
  agent: Agent
  messages: AgentSessionMessage[]
  children: (
    agent: Agent,
    agentSession: ConversationAgentSession,
    messages: AgentSessionMessage[],
  ) => React.ReactNode
}) {
  const agentSession = useAppSelector(selectCurrentConversationAgentSessionData)

  return (
    <AsyncRoute data={[agentSession]}>
      {([agentSessionValue]) => children(agent, agentSessionValue, messages)}
    </AsyncRoute>
  )
}

function FormAgentSessionRoute({
  agent,
  messages,
  children,
}: {
  agent: Agent
  messages: AgentSessionMessage[]
  children: (
    agent: Agent,
    agentSession: FormAgentSession,
    messages: AgentSessionMessage[],
  ) => React.ReactNode
}) {
  const agentSession = useAppSelector(selectCurrentFormAgentSessionData)

  return (
    <AsyncRoute data={[agentSession]}>
      {([agentSessionValue]) => children(agent, agentSessionValue, messages)}
    </AsyncRoute>
  )
}
