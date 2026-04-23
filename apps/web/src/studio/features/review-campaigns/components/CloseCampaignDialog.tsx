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

export function CloseCampaignDialog({ open, campaignName, onConfirm, onCancel }: Props) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close “{campaignName}”?</DialogTitle>
          <DialogDescription>
            Closing a campaign freezes all tester feedback and reviewer reviews. Participants will
            no longer be able to submit new sessions, feedback, or surveys. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm}>
            Close campaign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
