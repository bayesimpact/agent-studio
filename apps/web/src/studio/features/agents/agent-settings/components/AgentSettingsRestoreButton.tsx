import { Button } from "@caseai-connect/ui/shad/button"
import { RotateCcwIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ConfirmDialog } from "@/common/components/ConfirmDialog"
import { restoreAgentSettings } from "@/common/features/agents/agent-settings/agent-settings.thunks"
import { useAppDispatch } from "@/common/store/hooks"

/** One-click restore: copies the selected revision's settings as a new (current) revision. */
export function AgentSettingsRestoreButton({
  revision,
  disabled,
}: {
  revision: number
  disabled: boolean
}) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)

  const handleConfirm = async () => {
    setIsRestoring(true)
    try {
      await dispatch(restoreAgentSettings({ revision })).unwrap()
    } catch {
      // The studio agents middleware shows the error notification.
    } finally {
      setIsRestoring(false)
      setConfirmOpen(false)
    }
  }

  return (
    <>
      <Button size="sm" disabled={disabled || isRestoring} onClick={() => setConfirmOpen(true)}>
        <RotateCcwIcon className="size-4" />
        {t("agentSettings:history.restore")}
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        title={t("agentSettings:history.restoreDialog.title", { revision })}
        description={t("agentSettings:history.restoreDialog.description", { revision })}
        confirmLabel={t("agentSettings:history.restore")}
        confirmIcon={<RotateCcwIcon className="size-5" />}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}
