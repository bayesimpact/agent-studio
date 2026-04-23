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

export function DeleteCampaignDialog({ open, campaignName, onConfirm, onCancel }: Props) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete “{campaignName}”?</DialogTitle>
          <DialogDescription>
            This permanently deletes the draft campaign and its configuration. Only drafts can be
            deleted — active or closed campaigns must be kept for audit.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
