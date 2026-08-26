import { Button } from "@caseai-connect/ui/shad/button"
import { Trash2Icon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import type { ConversationAgentSession } from "@/common/features/agents/agent-sessions/conversation/conversation-agent-sessions.models"
import { deleteAgentSession } from "@/common/features/agents/agent-sessions/shared/base-agent-session/base-agent-sessions.thunks"
import type { Agent } from "@/common/features/agents/agents.models"
import { useGetAgentRoute } from "@/common/hooks/use-get-path"
import { useAppDispatch } from "@/common/store/hooks"

export function DeleteAgentSessionButton({
  agent,
  agentSession,
}: {
  agent: Agent
  agentSession: ConversationAgentSession
}) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const agentRoute = useGetAgentRoute()

  const handleSuccess = () => navigate(agentRoute)
  const handleDelete = () => {
    dispatch(
      deleteAgentSession({
        agentType: agent.type,
        agentId: agent.id,
        agentSessionId: agentSession.id,
        onSuccess: handleSuccess,
      }),
    )
  }

  return (
    <Button variant="outline" size="icon" onClick={handleDelete}>
      <Trash2Icon />
    </Button>
  )
}
