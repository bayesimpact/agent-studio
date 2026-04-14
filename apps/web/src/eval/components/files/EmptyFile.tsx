import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@caseai-connect/ui/shad/empty"
import { FileIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { UploadFile } from "./UploadFile"

export function EmptyFile() {
  const { t } = useTranslation("evaluation", { keyPrefix: "files.list.empty" })
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileIcon />
        </EmptyMedia>
        <EmptyTitle>{t("title")}</EmptyTitle>
        <EmptyDescription>{t("description")}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-col justify-center gap-2">
        <UploadFile />
      </EmptyContent>
    </Empty>
  )
}
