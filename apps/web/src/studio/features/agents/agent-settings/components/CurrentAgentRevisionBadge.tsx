import { selectAgentSettingsHistoryDataByAgentId } from "@/common/features/agents/agent-settings/agent-settings.selectors"
import { selectCurrentAgentData } from "@/common/features/agents/agents.selectors"
import { useAbility } from "@/common/hooks/use-ability"
import { useValue } from "@/common/hooks/use-value"
import { ADS } from "@/common/store/async-data-status"
import { useAppSelector } from "@/common/store/hooks"
import { AgentRevisionBadge } from "./AgentRevisionBadge"

/**
 * Store-connected {@link AgentRevisionBadge} for the current agent: pass a revision, get the
 * clickable badge and its history sheet.
 *
 * Studio-only. The Desk store has no agent settings slice, so routes shared with Desk must
 * inject this component from their Studio wiring instead of importing it directly.
 *
 * Renders nothing until the history is loaded — it is fetched by `StudioAgentRoute` for
 * managers only, and the sheet has no versions to show before then.
 */
export function CurrentAgentRevisionBadge({
  revision,
  tooltipKey,
}: {
  revision: number
  tooltipKey: React.ComponentProps<typeof AgentRevisionBadge>["tooltipKey"]
}) {
  const agent = useValue(selectCurrentAgentData)
  const { abilities } = useAbility()
  const versionsData = useAppSelector(
    selectAgentSettingsHistoryDataByAgentId({ agentId: agent.id, includeDraft: true }),
  )

  if (!abilities.canManageAgent({ agentId: agent.id })) return null
  if (!ADS.isFulfilled(versionsData)) return null

  return (
    <AgentRevisionBadge
      agent={agent}
      revision={revision}
      versions={versionsData.value}
      tooltipKey={tooltipKey}
    />
  )
}
