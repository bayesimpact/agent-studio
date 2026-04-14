import { Alert, AlertDescription, AlertTitle } from "@caseai-connect/ui/shad/alert"
import { Item } from "@caseai-connect/ui/shad/item"
import { CloudAlertIcon, Loader2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAppSelector } from "@/common/store/hooks"
import { selectUploaderState } from "@/eval/features/datasets/datasets.selectors"

export function UploaderState() {
  const uploaderState = useAppSelector(selectUploaderState)
  const { t } = useTranslation("document")
  return (
    <div className="flex flex-col gap-4 items-center justify-center">
      {uploaderState.status === "uploading" && (
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
