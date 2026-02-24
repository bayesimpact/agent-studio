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
import type { Evaluation } from "@/features/evaluations/evaluations.models"
import { createEvaluation } from "@/features/evaluations/evaluations.thunks"
import { useAppDispatch } from "@/store/hooks"
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
