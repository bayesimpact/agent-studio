import type { ExtractionAgentSessionSummary } from "@/features/agents/extraction-agent-sessions/extraction-agent-sessions.models"
import { selectCurrentExtractionAgentSessionsData } from "@/features/agents/extraction-agent-sessions/extraction-agent-sessions.selectors"
import { useAppSelector } from "@/store/hooks"
import { AsyncRoute } from "../AsyncRoute"

export function ExtractionAgentRoute({
  children,
}: {
  children: (agentSessions: ExtractionAgentSessionSummary[]) => React.ReactNode
}) {
  const agentSessions = useAppSelector(selectCurrentExtractionAgentSessionsData)

  return (
    <AsyncRoute data={[agentSessions]}>
      {([agentSessionsValue]) => children(agentSessionsValue)}
    </AsyncRoute>
  )
}
