import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { buildSince } from "@/common/utils/build-date"
import type { Agent } from "@/features/agents/agents.models"
import { getAgentIcon } from "@/features/agents/components/AgentIcon"
import type { ConversationAgentSession } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.models"
import { FormResult } from "@/features/agents/form-agent-sessions/components/FormResult"
import type { FormAgentSession } from "@/features/agents/form-agent-sessions/form-agent-sessions.models"
import type { AgentSessionMessage } from "@/features/agents/shared/agent-session-messages/agent-session-messages.models"
import { StudioAgentSessionMessages } from "@/features/agents/shared/agent-session-messages/components/AgentSessionMessages"
import { useGetPath } from "@/hooks/use-build-path"
import { GridHeader } from "@/studio/components/grid/Grid"
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
          <>
            <span className="capitalize-first">{agent.name}</span> •
            <span className="capitalize-first">{t(`agent:create.typeDialog.${agent.type}`)}</span>
            <Icon /> • {date}
          </>
        }
        action={<AgentSessionActions agent={agent} agentSession={agentSession} />}
      />

      <div className="flex-1">
        <StudioAgentSessionMessages
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
