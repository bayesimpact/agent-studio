import { selectCurrentAgentData } from "@/common/features/agents/agents.selectors"
import { DeprecatedModelBanner } from "@/common/features/agents/components/DeprecatedModelBanner"
import { useAbility } from "@/common/hooks/use-ability"
import { useMount } from "@/common/hooks/use-mount"
import { useValue } from "@/common/hooks/use-value"
import { agentHistoryActions } from "@/studio/features/agents/agent-history.slice"

/**
 * Loads the agent settings history for the whole Studio agent subtree, so the playground
 * can label message and header revisions without waiting for the editor's sheet to open.
 *
 * Manager-only: the history endpoint requires the manage-agent policy, and a member who
 * cannot manage the agent sees no version indicators.
 *
 * Rendering is not gated on the history — the playground shows immediately and the
 * indicators appear once the fetch lands.
 *
 * Also hosts the deprecated-model banner. This is the single mount point for both the agent
 * view and the editor view: `StudioRoutes.agentEdit` nests under `StudioRoutes.agent`, so
 * mounting the banner in `AgentEditorRoute` as well would render it twice there. The banner is a
 * fragment sibling rather than a wrapper so the full-height layouts below are untouched.
 */
export function StudioAgentRoute({ children }: { children: React.ReactNode }) {
  const agent = useValue(selectCurrentAgentData)
  const { abilities } = useAbility()

  useMount({
    actions: agentHistoryActions,
    condition: abilities.canManageAgent({ agentId: agent.id }),
    refreshOn: [agent.id],
  })

  return (
    <>
      <div className="px-6 pt-4 empty:hidden">
        <DeprecatedModelBanner model={agent.model} />
      </div>
      {children}
    </>
  )
}
