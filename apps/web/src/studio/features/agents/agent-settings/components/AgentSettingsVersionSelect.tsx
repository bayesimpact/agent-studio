import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@caseai-connect/ui/shad/select"
import { cn } from "@caseai-connect/ui/utils"
import { useTranslation } from "react-i18next"
import { findPublishedVersion } from "@/common/features/agents/agent-settings/agent-settings.functions"
import type { AgentSettings } from "@/common/features/agents/agent-settings/agent-settings.models"
import { buildDate } from "@/common/utils/build-date"

/**
 * Which settings version the playground runs new messages with.
 *
 * The draft is called out twice over — the trigger reads "v7 — Draft" and turns amber — because a
 * bare version number is not enough to stop someone demoing an unpublished agent to a client by
 * accident (issue #622).
 *
 * `versions` is the history list, newest first and already free of archived revisions: the history
 * endpoint omits them, so an archived version is never offered here.
 */
export function AgentSettingsVersionSelect({
  versions,
  revision,
  disabled,
  onRevisionChange,
}: {
  versions: AgentSettings[]
  revision: number | undefined
  disabled?: boolean
  onRevisionChange: (revision: number) => void
}) {
  const { t } = useTranslation()
  const publishedRevision = findPublishedVersion(versions)?.revision
  const selectedVersion = versions.find((version) => version.revision === revision)

  const buildVersionDetail = (version: AgentSettings) => {
    if (version.isDraft) return t("status:draft")
    if (version.revision === publishedRevision)
      return t("agentSettings:version.current", { date: buildDate(version.updatedAt) })
    return buildDate(version.updatedAt)
  }

  return (
    <Select
      value={revision !== undefined ? String(revision) : undefined}
      onValueChange={(value) => {
        const parsed = Number.parseInt(value, 10)
        if (!Number.isNaN(parsed)) onRevisionChange(parsed)
      }}
      disabled={disabled || versions.length === 0}
    >
      <SelectTrigger
        size="sm"
        aria-label={t("agentSettings:version.ariaLabel")}
        className={cn("font-normal", selectedVersion?.isDraft && "border-amber-500 text-amber-700")}
      >
        <SelectValue placeholder={t("agentSettings:version.placeholder")} />
      </SelectTrigger>
      <SelectContent>
        {versions.map((version) => (
          <SelectItem key={version.revision} value={String(version.revision)}>
            {t("agentSettings:version.item", {
              revision: version.revision,
              detail: buildVersionDetail(version),
            })}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
