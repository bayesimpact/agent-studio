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
import { EvaluationExtractionDatasetCreator } from "./EvaluationExtractionDatasetCreator"

export function EmptyEvaluationExtractionDataset() {
  const { t } = useTranslation("evaluation", { keyPrefix: "dataset.list.empty" })
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
        <EvaluationExtractionDatasetCreator />
      </EmptyContent>
    </Empty>
  )
}
