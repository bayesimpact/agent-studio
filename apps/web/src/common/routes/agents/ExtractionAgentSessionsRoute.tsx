import { useOutlet } from "react-router-dom"
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
  // This route is the element for the parent `agent.path` route, so it renders unconditionally
  // for every nested route under it, including `agentEdit`. `ExtractionAgentSessionList` swaps in
  // that nested route's outlet in place of its own list UI, but this wrapper still runs on every
  // render regardless of which child matched. `AgentEditorRoute` already owns the settings load
  // while it is the active child (it needs the load blocking, this one doesn't), so this route
  // only owns the load while showing its own list UI (no child route matched) to avoid a
  // duplicate `listAgentSettings` dispatch on every visit to the edit page.
  const outlet = useOutlet()

  useMount({ actions: extractionAgentSessionsActions, refreshOn: [agentId] })
  useMount({ actions: agentSettingsActions, condition: !outlet, refreshOn: [agentId] })

  return <AsyncRoute data={[agentSessions]}>{children}</AsyncRoute>
}
