import { Badge } from "@caseai-connect/ui/shad/badge"
import { Item, ItemContent, ItemHeader, ItemTitle } from "@caseai-connect/ui/shad/item"
import { Separator } from "@caseai-connect/ui/shad/separator"
import type { Agent } from "@/features/agents/agents.models"
import { selectCurrentAgentData } from "@/features/agents/agents.selectors"
import type { ConversationAgentSession } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.models"
import { selectCurrentConversationAgentSessionData } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.selectors"
import type { FormAgentSession } from "@/features/agents/form-agent-sessions/form-agent-sessions.models"
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

  if (ADS.isError(agent) || ADS.isError(agentSession) || ADS.isError(messages))
    return (
      <ErrorRoute error={agent.error || agentSession.error || messages.error || "Unknown error"} />
    )

  if (ADS.isFulfilled(agent) && ADS.isFulfilled(agentSession) && ADS.isFulfilled(messages)) {
    return (
      <WithData agent={agent.value} agentSession={agentSession.value} messages={messages.value} />
    )
  }

  return <LoadingRoute />
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

function FormResult({ agent, agentSession }: { agent: Agent; agentSession: FormAgentSession }) {
  const form = buildForm({ agent, agentSession })
  return (
    <Item>
      <ItemHeader>
        <ItemTitle className="text-lg">Form output:</ItemTitle>
      </ItemHeader>
      <ItemContent>
        {Object.entries(form).map(([key, value], index) => {
          const hasValue = value !== ""
          return (
            <div key={key}>
              {index > 0 && <Separator className="opacity-50" />}
              <div className="flex gap-2 py-4 items-center">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {key}
                </span>
                {hasValue ? (
                  <Badge variant="outline" className="w-fit text-muted-foreground font-mono">
                    {value}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="w-fit text-muted-foreground opacity-50 font-mono"
                  >
                    —
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
      </ItemContent>
    </Item>
  )
}

function buildForm({ agent, agentSession }: { agent: Agent; agentSession: FormAgentSession }) {
  const properties = Object.fromEntries(
    Object.entries(agent.outputJsonSchema?.properties ?? {}).map(([key]) => [key, ""]),
  )
  if (agentSession.result) {
    for (const key of Object.keys(properties)) {
      if (key in agentSession.result) {
        properties[key] = String(agentSession.result[key])
      }
    }
  }
  return properties
}
