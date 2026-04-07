import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@caseai-connect/ui/shad/empty"
import { ListChecksIcon } from "lucide-react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useAppDispatch } from "@/common/store/hooks"
import type { Evaluation } from "@/studio/features/evaluations/evaluations.models"
import { createEvaluation } from "@/studio/features/evaluations/evaluations.thunks"
import { EvaluationCreator } from "./EvaluationCreator"

export function EmptyEvaluation() {
  const { t } = useTranslation("evaluation", { keyPrefix: "empty" })

  const dispatch = useAppDispatch()
  const handleCreate = useCallback(
    (fields: Pick<Evaluation, "input" | "expectedOutput">) => {
      dispatch(createEvaluation({ fields }))
    },
    [dispatch],
  )
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ListChecksIcon />
        </EmptyMedia>
        <EmptyTitle>{t("title")}</EmptyTitle>
        <EmptyDescription>{t("description")}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <EvaluationCreator onSubmit={handleCreate} />
      </EmptyContent>
    </Empty>
  )
}
