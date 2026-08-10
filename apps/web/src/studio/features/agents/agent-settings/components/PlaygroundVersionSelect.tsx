import { useTranslation } from "react-i18next"
import { selectStreaming } from "@/common/features/agents/agent-sessions/shared/agent-session-messages/agent-session-messages.selectors"
import { agentSettingsActions } from "@/common/features/agents/agent-settings/agent-settings.slice"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { AgentSettingsVersionSelect } from "./AgentSettingsVersionSelect"

/**
 * The playground's version picker. Locked while a reply is streaming, since switching mid-answer
 * would misattribute the reply to the version the picker ends up showing.
 */
export function PlaygroundVersionSelect({
  agentId,
  agentSessionId,
  revision,
}: {
  agentId: string
  agentSessionId: string
  revision: number | undefined
}) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const isStreaming = useAppSelector(selectStreaming)

  return (
    <AgentSettingsVersionSelect
      agentId={agentId}
      revision={revision}
      ariaLabel={t("agentSettings:version.ariaLabel")}
      disabled={isStreaming}
      onChange={(nextRevision) =>
        dispatch(
          agentSettingsActions.setPlaygroundRevision({ agentSessionId, revision: nextRevision }),
        )
      }
    />
  )
}
