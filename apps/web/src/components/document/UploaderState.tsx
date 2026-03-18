import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@caseai-connect/ui/shad/dialog"
import { CheckCheck, CloudAlertIcon, Loader2 } from "lucide-react"
import { selectUploaderState } from "@/features/documents/documents.selectors"
import { useAppSelector } from "@/store/hooks"

export function UploaderState() {
  const uploaderState = useAppSelector(selectUploaderState)
  const wrap = (content: React.ReactNode) => (
    <div className="flex items-center gap-2 px-4 py-2 text-sm">{content}</div>
  )
  switch (uploaderState.status) {
    case "uploading":
      return wrap(
        <>
          <Loader2 className="animate-spin size-4" />
          <span className="text-xs text-muted-foreground">
            {uploaderState.completed}/{uploaderState.total}
          </span>
        </>,
      )

    case "error":
      return wrap(
        <Dialog>
          <DialogTrigger asChild>
            <Button size="icon-sm" variant="destructive">
              <CloudAlertIcon className="animate-bounce" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              {/* // FIXME: 18n */}
              <DialogTitle>Error uploading documents:</DialogTitle>
            </DialogHeader>

            {uploaderState.errors?.join(", ")}
          </DialogContent>
        </Dialog>,
      )

    case "completed":
      return wrap(<CheckCheck className="size-4 text-green-500" />)
    default:
      return null
  }
}
