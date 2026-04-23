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
  onConfirm: () => void
  onCancel: () => void
}

export function FinishParticipatingDialog({ open, onConfirm, onCancel }: Props) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finish participating?</DialogTitle>
          <DialogDescription>
            You'll be taken to the end-of-phase survey. You can still start new sessions and edit
            your survey until the campaign closes.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Not yet
          </Button>
          <Button type="button" onClick={onConfirm}>
            Go to the survey
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
