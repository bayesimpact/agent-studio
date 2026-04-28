import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@caseai-connect/ui/shad/dialog"
import { useTranslation } from "react-i18next"

type Props = {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function FinishParticipatingDialog({ open, onConfirm, onCancel }: Props) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("testerCampaigns:finishDialog.title")}</DialogTitle>
          <DialogDescription>{t("testerCampaigns:finishDialog.description")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("testerCampaigns:finishDialog.notYet")}
          </Button>
          <Button type="button" onClick={onConfirm}>
            {t("testerCampaigns:finishDialog.goToSurvey")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
