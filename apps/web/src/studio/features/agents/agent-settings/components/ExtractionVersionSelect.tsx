import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { selectExtractionRevision } from "@/common/features/agents/agent-settings/agent-settings.selectors"
import { agentSettingsActions } from "@/common/features/agents/agent-settings/agent-settings.slice"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { AgentSettingsVersionSelect } from "./AgentSettingsVersionSelect"

/**
 * The extraction screens' version picker. Keyed by agent rather than by session, because the
 * choice is made before any run exists, and it drives both the single-document and the CSV fork.
 */
export function ExtractionVersionSelect({ agentId }: { agentId: string }) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const selectRevision = useMemo(() => selectExtractionRevision({ agentId }), [agentId])
  const revision = useAppSelector(selectRevision)

  return (
    <AgentSettingsVersionSelect
      agentId={agentId}
      revision={revision}
      ariaLabel={t("agentSettings:version.extractionAriaLabel")}
      onChange={(nextRevision) =>
        dispatch(agentSettingsActions.setExtractionRevision({ agentId, revision: nextRevision }))
      }
    />
  )
}
