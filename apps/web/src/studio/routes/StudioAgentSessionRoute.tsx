import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { GridHeader } from "@/common/components/grid/Grid"
import { buildSince } from "@/common/utils/build-date"
import type { ConversationAgentSession } from "@/features/agents/agent-sessions/conversation/conversation-agent-sessions.models"
import { FormResult } from "@/features/agents/agent-sessions/form/components/FormResult"
import type { FormAgentSession } from "@/features/agents/agent-sessions/form/form-agent-sessions.models"
import type { AgentSessionMessage } from "@/features/agents/agent-sessions/shared/agent-session-messages/agent-session-messages.models"
import { AgentSessionMessages } from "@/features/agents/agent-sessions/shared/agent-session-messages/components/AgentSessionMessages"
import type { Agent } from "@/features/agents/agents.models"
import { getAgentIcon } from "@/features/agents/components/AgentIcon"
import { useGetPath } from "@/hooks/use-build-path"
import { AgentSessionActions } from "../features/agents/components/AgentSessionActions"

type AgentSession = ConversationAgentSession | FormAgentSession
export function StudioAgentSessionRoute({
  agent,
  agentSession,
  messages,
}: {
  agent: Agent
  agentSession: AgentSession
  messages: AgentSessionMessage[]
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { getPath } = useGetPath()

  const Icon = getAgentIcon(agent.type)

  const date = buildSince(agentSession.updatedAt)

  const handleBack = () => {
    const path = getPath("agent")
    navigate(path)
  }

  return (
    <div className="flex flex-col h-full">
      <GridHeader
        onBack={handleBack}
        title="Playground"
        description={
          <div className="flex items-center gap-2 flex-wrap">
            <span className="capitalize-first">{agent.name}</span> •
            <span className="capitalize-first">{t(`agent:create.typeDialog.${agent.type}`)}</span>
            <Icon /> • {date}
          </div>
        }
        action={<AgentSessionActions agent={agent} agentSession={agentSession} />}
      />

      <div className="flex-1">
        <AgentSessionMessages
          session={agentSession}
          messages={messages}
          rightSlot={
            agent.type === "form" ? (
              <FormResult agent={agent} agentSession={agentSession} />
            ) : undefined
          }
        />
      </div>
    </div>
  )
}
