import { useAppSelector } from "@/common/store/hooks"
import type { ExtractionAgentSessionSummary } from "@/features/agents/agent-sessions/extraction/extraction-agent-sessions.models"
import { selectCurrentExtractionAgentSessionsData } from "@/features/agents/agent-sessions/extraction/extraction-agent-sessions.selectors"
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
