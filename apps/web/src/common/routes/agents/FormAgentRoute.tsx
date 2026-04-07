import type { FormAgentSession } from "@/features/agents/form-agent-sessions/form-agent-sessions.models"
import { selectCurrentFormAgentSessionsData } from "@/features/agents/form-agent-sessions/form-agent-sessions.selectors"
import { useAppSelector } from "@/store/hooks"
import { AsyncRoute } from "../AsyncRoute"

export function FormAgentRoute({
  children,
}: {
  children: (agentSessions: FormAgentSession[]) => React.ReactNode
}) {
  const agentSessions = useAppSelector(selectCurrentFormAgentSessionsData)
  return (
    <AsyncRoute data={[agentSessions]}>
      {([agentSessionsValue]) => children(agentSessionsValue)}
    </AsyncRoute>
  )
}
