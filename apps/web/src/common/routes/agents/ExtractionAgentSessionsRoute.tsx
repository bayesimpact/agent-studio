import { selectCurrentExtractionAgentSessionsData } from "@/common/features/agents/agent-sessions/extraction/extraction-agent-sessions.selectors"
import { extractionAgentSessionsActions } from "@/common/features/agents/agent-sessions/extraction/extraction-agent-sessions.slice"
import { selectCurrentAgentId } from "@/common/features/agents/agents.selectors"
import { agentSettingsActions } from "@/common/features/agents/settings/agent-settings.slice"
import { useMount } from "@/common/hooks/use-mount"
import { useCurrentId } from "@/common/hooks/use-value"
import { useAppSelector } from "@/common/store/hooks"
import { AsyncRoute } from "../AsyncRoute"

// Load agent settings for the inline editor in `ExtractionAgentSessionList`. Opt-in per scope:
// Studio already loads them for the whole `agent.path` subtree via `AgentRoute`, so only Desk,
// which does not, asks for them here.
export function ExtractionAgentSessionsRoute({
  children,
  loadSettings = false,
}: {
  children: React.ReactNode
  /**
   * Load the agent's settings revisions for `ExtractionAgentSessionList`'s inline editor. Opt-in
   * per scope: Studio already loads them for the whole `agent.path` subtree via `AgentRoute`, so
   * only Desk, which does not, asks for them here.
   */
  loadSettings?: boolean
}) {
  const agentId = useCurrentId(selectCurrentAgentId)
  const agentSessions = useAppSelector(selectCurrentExtractionAgentSessionsData)

  useMount({ actions: extractionAgentSessionsActions, refreshOn: [agentId] })
  useMount({ actions: agentSettingsActions, condition: loadSettings, refreshOn: [agentId] })

  return <AsyncRoute data={[agentSessions]}>{children}</AsyncRoute>
}
