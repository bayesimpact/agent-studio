import { useMemo, useState } from "react"
import type { AgentSettings } from "@/common/features/agents/settings/agent-settings.models"
import { selectAgentSettingsData } from "@/common/features/agents/settings/agent-settings.selectors"
import { useValue } from "@/common/hooks/use-value"
import { AgentVersionCompare, type AgentVersionCompareMode } from "./AgentVersionCompare"
import { AgentVersionList } from "./AgentVersionList"

interface AgentVersionComparison {
  /** The most recent version (`versions[0]`). */
  current: AgentSettings
  /** The version highlighted in the timeline and shown in the diff. */
  selected: AgentSettings
  /** The version immediately older than `selected`, if any. */
  previous: AgentSettings | undefined
  isCurrent: boolean
  canComparePrevious: boolean
  canCompareCurrent: boolean
  /** The requested `mode`, downgraded to whichever comparison is actually possible. */
  effectiveMode: AgentVersionCompareMode
  /** Older/newer versions fed to the diff, derived from `effectiveMode`. */
  before: AgentSettings
  after: AgentSettings
}

/**
 * Resolve everything the two panes need from the raw version list plus the current UI state.
 *
 * `versions` is ordered by revision descending, so `versions[0]` is the current version and
 * each following index is one step older. Returns `null` when there is no version to show.
 */
function buildComparison(
  versions: AgentSettings[],
  selectedRevision: number | null,
  mode: AgentVersionCompareMode,
): AgentVersionComparison | null {
  const current = versions[0]
  if (!current) return null

  // Default to the previous version (index 1) — the one users open the history to inspect —
  // until they pick another revision from the timeline. Clamp to the current version when it
  // is the only one available.
  const requestedIndex = versions.findIndex((version) => version.revision === selectedRevision)
  const selectedIndex = requestedIndex === -1 ? Math.min(1, versions.length - 1) : requestedIndex

  const selected = versions[selectedIndex] ?? current
  const previous = versions[selectedIndex + 1]

  const isCurrent = selected.revision === current.revision
  const canComparePrevious = previous !== undefined
  const canCompareCurrent = !isCurrent

  // Honour the requested mode, but fall back to whichever comparison is possible.
  let effectiveMode = mode
  if (mode === "current" && !canCompareCurrent) effectiveMode = "previous"
  if (mode === "previous" && !canComparePrevious) effectiveMode = "current"

  const [before, after] =
    effectiveMode === "current" ? [selected, current] : [previous ?? selected, selected]

  return {
    current,
    selected,
    previous,
    isCurrent,
    canComparePrevious,
    canCompareCurrent,
    effectiveMode,
    before,
    after,
  }
}

/**
 * Two-pane version explorer: revision timeline on the left, comparison on the right.
 */
export function AgentVersionExplorer() {
  const versions = useValue(selectAgentSettingsData)
  const [selectedRevision, setSelectedRevision] = useState<number | null>(null)
  const [mode, setMode] = useState<AgentVersionCompareMode>("current")

  const comparison = useMemo(
    () => buildComparison(versions, selectedRevision, mode),
    [versions, selectedRevision, mode],
  )
  if (!comparison) return null

  const {
    selected,
    before,
    after,
    isCurrent,
    effectiveMode,
    canComparePrevious,
    canCompareCurrent,
  } = comparison

  return (
    <div className="flex min-h-0 flex-1">
      <AgentVersionList
        versions={versions}
        selectedRevision={selected.revision}
        onSelect={setSelectedRevision}
      />
      <AgentVersionCompare
        before={before}
        after={after}
        selected={selected}
        isCurrent={isCurrent}
        mode={effectiveMode}
        onModeChange={setMode}
        canComparePrevious={canComparePrevious}
        canCompareCurrent={canCompareCurrent}
      />
    </div>
  )
}
