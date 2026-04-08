import { useNavigate } from "react-router-dom"
import { buildDate, buildSince } from "@/common/utils/build-date"
import type { ConversationAgentSession } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.models"
import type { ExtractionAgentSession } from "@/features/agents/extraction-agent-sessions/extraction-agent-sessions.models"
import type { FormAgentSession } from "@/features/agents/form-agent-sessions/form-agent-sessions.models"
import { useBuildPath } from "@/hooks/use-build-path"
import { GridItem } from "@/studio/components/grid/Grid"

type AgentSession = ConversationAgentSession | FormAgentSession | ExtractionAgentSession

export function AgentSessionItem({
  agentSession,
  organizationId,
  agentId,
  projectId,
  className,
  index,
}: {
  index: number
  className?: string
  agentSession: AgentSession
  organizationId: string
  agentId: string
  projectId: string
}) {
  const navigate = useNavigate()
  const { buildPath } = useBuildPath()
  const handleClick = () => {
    const path = buildPath("agentSession", {
      organizationId,
      projectId,
      agentId,
      agentSessionId: agentSession.id,
    })
    navigate(path)
  }

  const title = buildSince(agentSession.updatedAt)
  const badge = buildDate(agentSession.updatedAt)

  return (
    <GridItem
      index={index}
      className={className}
      badge={badge}
      onClick={handleClick}
      title={title}
      // FIXME: show last message
      description=""
    />
  )
}
