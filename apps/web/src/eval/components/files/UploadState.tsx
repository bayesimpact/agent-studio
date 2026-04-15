import { Alert, AlertDescription, AlertTitle } from "@caseai-connect/ui/shad/alert"
import { Item } from "@caseai-connect/ui/shad/item"
import { cn } from "@caseai-connect/ui/utils"
import { CloudAlertIcon, Loader2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAppSelector } from "@/common/store/hooks"
import { selectUploaderState } from "@/eval/features/datasets/datasets.selectors"

export function UploaderState() {
  const uploaderState = useAppSelector(selectUploaderState)
  const { t } = useTranslation("document")
  const isUploading = uploaderState.status === "uploading"
  return (
    <div className={cn("flex flex-col gap-4 items-center justify-center", isUploading && "py-4")}>
      {isUploading && (
        <Item variant="muted" className="w-full">
          <Loader2Icon className="animate-spin size-5" />
          <span className="text-sm">
            {t("uploading", {
              processed: uploaderState.processed,
              total: uploaderState.total,
            })}
          </span>
        </Item>
      )}

      {uploaderState.errors?.map((error, index) => (
        <Alert key={`${error.title.length}-${index}`} className="text-destructive">
          <CloudAlertIcon />
          <AlertTitle>{error.title}</AlertTitle>
          <AlertDescription>{error.description}</AlertDescription>
        </Alert>
      ))}
    </div>
  )
}
