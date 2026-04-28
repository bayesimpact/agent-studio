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
  campaignName: string
  onConfirm: () => void
  onCancel: () => void
}

export function ActivateCampaignDialog({ open, campaignName, onConfirm, onCancel }: Props) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("reviewCampaigns:dialogs.activate.title", { name: campaignName })}
          </DialogTitle>
          <DialogDescription>{t("reviewCampaigns:dialogs.activate.description")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("reviewCampaigns:dialogs.cancel")}
          </Button>
          <Button type="button" onClick={onConfirm}>
            {t("reviewCampaigns:dialogs.activate.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
