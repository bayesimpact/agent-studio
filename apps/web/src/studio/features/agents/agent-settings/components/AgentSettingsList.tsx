import { Badge } from "@caseai-connect/ui/shad/badge"
import { cn } from "@caseai-connect/ui/utils"
import { useTranslation } from "react-i18next"
import type { AgentSettings } from "@/common/features/agents/agent-settings/agent-settings.models"
import { buildDate, buildSince } from "@/common/utils/build-date"

/** Timeline of an agent's settings revisions, newest first. */
export function AgentSettingsList({
  versions,
  selectedRevision,
  onSelect,
}: {
  versions: AgentSettings[]
  selectedRevision: number
  onSelect: (revision: number) => void
}) {
  const { t } = useTranslation()
  // The published revision the agent actually runs with: the newest one that is not a draft.
  const currentRevision = versions.find((version) => !version.isDraft)?.revision

  return (
    <aside className="w-fit min-w-52 max-w-72 shrink-0 overflow-y-auto border-r">
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
                {t("agentSettings:history.revisionLabel", { revision: version.revision })}
                {version.isDraft && <Badge variant="warning">{t("status:draft")}</Badge>}
                {version.revision === currentRevision && (
                  <Badge variant="success">{t("agentSettings:history.currentBadge")}</Badge>
                )}
              </span>
              {version.name?.trim() && (
                <span className="mt-1 block text-sm line-clamp-2" title={version.name}>
                  {version.name}
                </span>
              )}
              {version.description?.trim() && (
                <span
                  className="mt-0.5 block text-xs text-muted-foreground line-clamp-3"
                  title={version.description}
                >
                  {version.description}
                </span>
              )}
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
