import { selectCurrentExtractionAgentSessionsData } from "@/common/features/agents/agent-sessions/extraction/extraction-agent-sessions.selectors"
import { extractionAgentSessionsActions } from "@/common/features/agents/agent-sessions/extraction/extraction-agent-sessions.slice"
import { selectCurrentAgentId } from "@/common/features/agents/agents.selectors"
import { agentSettingsActions } from "@/common/features/agents/settings/agent-settings.slice"
import { useMount } from "@/common/hooks/use-mount"
import { useCurrentId } from "@/common/hooks/use-value"
import { useAppSelector } from "@/common/store/hooks"
import { AsyncRoute } from "../AsyncRoute"

// Extraction agents can be managed inline from the session list (`ExtractionAgentSessionList`
// renders the full `AgentEditor` when the viewer can manage the agent), so this route also
// loads the agent's settings. That load is not part of the `AsyncRoute` gate below: it only
// feeds the inline editor panel, which most viewers never see, so blocking the whole page on
// it would delay the session list and creation UI for the common case.
export function ExtractionAgentSessionsRoute({ children }: { children: React.ReactNode }) {
  const agentId = useCurrentId(selectCurrentAgentId)
  const agentSessions = useAppSelector(selectCurrentExtractionAgentSessionsData)

  useMount({ actions: extractionAgentSessionsActions, refreshOn: [agentId] })
  useMount({ actions: agentSettingsActions, refreshOn: [agentId] })

  return <AsyncRoute data={[agentSessions]}>{children}</AsyncRoute>
}
