import { Button } from "@caseai-connect/ui/shad/button"
import { Trash2Icon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAppDispatch } from "@/common/store/hooks"
import type { Agent } from "@/features/agents/agents.models"
import type { ConversationAgentSession } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.models"
import type { FormAgentSession } from "@/features/agents/form-agent-sessions/form-agent-sessions.models"
import { deleteAgentSession } from "@/features/agents/shared/base-agent-session/base-agent-sessions.thunks"
import { useGetPath } from "@/hooks/use-build-path"
import { TraceUrlOpener } from "@/studio/components/TraceUrlOpener"

type AgentSession = ConversationAgentSession | FormAgentSession
export function AgentSessionActions({
  agent,
  agentSession,
}: {
  agent: Agent
  agentSession: AgentSession
}) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { getPath } = useGetPath()

  const handleSuccess = () => navigate(getPath("agent"))
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
    <>
      <TraceUrlOpener buttonProps={{ variant: "secondary" }} traceUrl={agentSession.traceUrl} />
      <Button variant="outline" size="icon" onClick={handleDelete}>
        <Trash2Icon />
      </Button>
    </>
  )
}
