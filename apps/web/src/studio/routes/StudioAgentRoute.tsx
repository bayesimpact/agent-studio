import { selectAgentSettingsDataByAgentId } from "@/common/features/agents/agent-settings/agent-settings.selectors"
import { agentSettingsActions } from "@/common/features/agents/agent-settings/agent-settings.slice"
import { selectCurrentAgentData } from "@/common/features/agents/agents.selectors"
import { DeprecatedModelBanner } from "@/common/features/agents/components/DeprecatedModelBanner"
import { useAbility } from "@/common/hooks/use-ability"
import { useMount } from "@/common/hooks/use-mount"
import { useValue } from "@/common/hooks/use-value"
import { useAppSelector } from "@/common/store/hooks"

/**
 * Loads the agent settings history for the whole Studio agent subtree, so the playground
 * can label message and header revisions without waiting for the editor's sheet to open.
 *
 * Manager-only: the history endpoint requires the manage-agent policy, and a member who
 * cannot manage the agent sees no version indicators.
 *
 * Rendering is not gated on the history — the playground shows immediately and the
 * indicators appear once the fetch lands. The deprecated-model banner reads the same
 * history and lives here so every view under the agent carries it exactly once; an
 * absent model (fetch still in flight, or a member who cannot manage the agent) renders
 * nothing.
 */
export function StudioAgentRoute({ children }: { children: React.ReactNode }) {
  const agent = useValue(selectCurrentAgentData)
  const { abilities } = useAbility()

  useMount({
    actions: agentSettingsActions,
    condition: abilities.canManageAgent({ agentId: agent.id }),
    refreshOn: [agent.id],
  })

  const agentSettings = useAppSelector(
    selectAgentSettingsDataByAgentId({ agentId: agent.id, includeDraft: true }),
  )

  return (
    <>
      <div className="px-6 pt-4 empty:hidden bg-white">
        <DeprecatedModelBanner model={agentSettings.value?.model} />
      </div>
      {children}
    </>
  )
}
