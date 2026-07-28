import { Badge } from "@caseai-connect/ui/shad/badge"
import { cn } from "@caseai-connect/ui/utils"
import { useTranslation } from "react-i18next"
import type { AgentSettings } from "@/common/features/agents/settings/agent-settings.models"
import { buildDate, buildSince } from "@/common/utils/build-date"

/**
 * Timeline of an agent's settings revisions, newest first.
 *
 * The newest revision may be an unpublished draft, so it is badged separately from
 * `liveRevision`, the newest published revision the running agent actually serves.
 */
export function AgentVersionList({
  versions,
  selectedRevision,
  liveRevision,
  onSelect,
}: {
  versions: AgentSettings[]
  selectedRevision: number
  liveRevision: number | undefined
  onSelect: (revision: number) => void
}) {
  const { t } = useTranslation()

  return (
    <aside className="w-52 shrink-0 overflow-y-auto border-r">
      <ol>
        {versions.map((version) => (
          <li key={version.revision}>
            <button
              type="button"
              onClick={() => onSelect(version.revision)}
              aria-current={version.revision === selectedRevision}
              className={cn(
                "w-full border-b px-4 py-3 text-left transition-colors hover:bg-muted/50",
                version.revision === selectedRevision && "bg-muted hover:bg-muted",
              )}
            >
              <span className="flex items-center justify-between gap-2 text-sm font-medium">
                {t("agent:history.revisionLabel", { revision: version.revision })}
                {version.isDraft ? (
                  <Badge variant="outline">{t("agent:history.draftBadge")}</Badge>
                ) : (
                  version.revision === liveRevision && (
                    <Badge variant="secondary">{t("agent:history.currentBadge")}</Badge>
                  )
                )}
              </span>
              <span
                className="mt-1 block text-xs text-muted-foreground"
                title={buildDate(version.updatedAt)}
              >
                {buildSince(version.updatedAt)}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </aside>
  )
}
