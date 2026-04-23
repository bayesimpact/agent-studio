import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@caseai-connect/ui/shad/dialog"

type Props = {
  open: boolean
  campaignName: string
  onConfirm: () => void
  onCancel: () => void
}

export function ActivateCampaignDialog({ open, campaignName, onConfirm, onCancel }: Props) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Activate “{campaignName}”?</DialogTitle>
          <DialogDescription>
            Once activated, the configuration (agent, questions) is locked and the campaign is
            visible to invited testers and reviewers. You can still invite more participants.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm}>
            Activate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
