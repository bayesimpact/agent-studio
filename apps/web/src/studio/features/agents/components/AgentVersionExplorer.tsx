import { useMemo, useState } from "react"
import type { Agent } from "@/common/features/agents/agents.models"
import { useValue } from "@/common/hooks/use-value"
import { selectAgentHistoryData } from "../agent-history.selectors"
import {
  AgentVersionCompare,
  type AgentVersionCompareAvailability,
  type AgentVersionCompareMode,
} from "./AgentVersionCompare"
import { AgentVersionList } from "./AgentVersionList"

interface AgentVersionComparison {
  /** The version highlighted in the timeline and shown in the diff. */
  selected: Agent
  /** `selected` is the newest version, so there is nothing newer to restore from. */
  isLatest: boolean
  /** The agent has a pending draft, so the "draft" mode is offered as a third comparison. */
  hasDraft: boolean
  /** Which of the three comparisons are possible for `selected`. */
  availability: AgentVersionCompareAvailability
  /** The requested `mode`, downgraded to whichever comparison is actually possible. */
  effectiveMode: AgentVersionCompareMode
  /** Older/newer versions fed to the diff, derived from `effectiveMode`. */
  before: Agent
  after: Agent
}

/** Tried in order when the requested mode is not available for the selected version. */
const modeFallbackOrder: AgentVersionCompareMode[] = ["previous", "current", "draft"]

/**
 * Resolve everything the two panes need from the raw version list plus the current UI state.
 *
 * `versions` is ordered by revision descending, so `versions[0]` is the newest version — the
 * pending draft when there is one — and each following index is one step older. Returns `null`
 * when there is no version to show.
 */
export function buildComparison(
  versions: Agent[],
  selectedRevision: number | null,
  mode: AgentVersionCompareMode,
): AgentVersionComparison | null {
  const latest = versions[0]
  if (!latest) return null

  // The draft (at most one, always the newest revision) and the published version the agent
  // actually runs with — the two things an older revision can be compared against.
  const draft = latest.isDraft ? latest : undefined
  const published = versions.find((version) => !version.isDraft)

  // Default selection, until the user picks a revision from the timeline: the pending draft when
  // there is one (its diff against the last published version is what users open the history for),
  // otherwise the previous version (index 1). Clamp when the list has a single entry.
  const defaultIndex = draft ? 0 : Math.min(1, versions.length - 1)
  const requestedIndex = versions.findIndex((version) => version.revision === selectedRevision)
  const selectedIndex = requestedIndex === -1 ? defaultIndex : requestedIndex

  const selected = versions[selectedIndex] ?? latest
  const previous = versions[selectedIndex + 1]

  // A comparison target only makes sense when it is strictly newer than the selected version,
  // otherwise the diff would run backwards or against the selection itself.
  const availability: AgentVersionCompareAvailability = {
    previous: previous !== undefined,
    current: published !== undefined && selected.revision < published.revision,
    draft: draft !== undefined && selected.revision < draft.revision,
  }

  const effectiveMode = availability[mode]
    ? mode
    : (modeFallbackOrder.find((candidate) => availability[candidate]) ?? "previous")

  const newer = effectiveMode === "draft" ? draft : published
  const [before, after] =
    effectiveMode === "previous" ? [previous ?? selected, selected] : [selected, newer ?? selected]

  return {
    selected,
    isLatest: selected.revision === latest.revision,
    hasDraft: draft !== undefined,
    availability,
    effectiveMode,
    before,
    after,
  }
}

/**
 * Two-pane version explorer: revision timeline on the left, comparison on the right.
 * `initialRevision` preselects a revision — used when the explorer is opened from a
 * revision badge rather than from the editor's history button.
 */
export function AgentVersionExplorer({ initialRevision }: { initialRevision?: number }) {
  const versions = useValue(selectAgentHistoryData)
  const [selectedRevision, setSelectedRevision] = useState<number | null>(initialRevision ?? null)
  const [mode, setMode] = useState<AgentVersionCompareMode>("current")

  const comparison = useMemo(
    () => buildComparison(versions, selectedRevision, mode),
    [versions, selectedRevision, mode],
  )
  if (!comparison) return null

  const { selected, before, after, isLatest, hasDraft, availability, effectiveMode } = comparison

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
        isLatest={isLatest}
        hasDraft={hasDraft}
        availability={availability}
        mode={effectiveMode}
        onModeChange={setMode}
      />
    </div>
  )
}
