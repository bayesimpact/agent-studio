import { Button } from "@caseai-connect/ui/shad/button"
import { Item, ItemContent, ItemFooter, ItemHeader, ItemTitle } from "@caseai-connect/ui/shad/item"
import { Label } from "@caseai-connect/ui/shad/label"
import { isEqual } from "date-fns"
import { Trash2Icon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { EvaluationRunner } from "@/components/evaluation/EvaluationRunner"
import type { Agent } from "@/features/agents/agents.models"
import type { Evaluation } from "@/features/evaluations/evaluations.models"
import { deleteEvaluation } from "@/features/evaluations/evaluations.thunks"
import { useAppDispatch } from "@/store/hooks"
import { buildDate } from "@/utils/build-date"
import { EvaluationEditor } from "./EvaluationCreator"
import { EvaluationReports } from "./EvaluationReports"

export function EvaluationItem({
  evaluation,
  agents,
}: {
  evaluation: Evaluation
  agents: Agent[]
}) {
  const { t } = useTranslation("evaluation")
  const { t: tcommon } = useTranslation("common")
  const dispatch = useAppDispatch()

  const [open, setOpen] = useState(false)
  const handleDelete = () => {
    dispatch(deleteEvaluation({ evaluationId: evaluation.id }))
  }

  const handleRun = () => {
    setOpen(true)
  }

  return (
    <Item variant="outline">
      <ItemHeader>
        <ItemTitle>
          <div className="flex gap-2 text-muted-foreground text-xs">
            <div className="flex gap-1">
              <span>
                {tcommon("createdAt")} {buildDate(evaluation.createdAt)}
              </span>
            </div>
            {!isEqual(evaluation.createdAt, evaluation.updatedAt) && (
              <>
                •{" "}
                <div className="flex gap-1">
                  <span>
                    {tcommon("updatedAt")} {buildDate(evaluation.updatedAt)}
                  </span>
                </div>
              </>
            )}
          </div>
        </ItemTitle>

        <div className="flex gap-2 items-center">
          <Button onClick={handleRun}>{t("table.buttons.run")}</Button>
          <EvaluationRunner
            ids={[evaluation.id]}
            agents={agents}
            modalHandler={{ open, setOpen }}
          />

          <EvaluationEditor evaluation={evaluation} />

          <Button variant="ghost" size="icon" onClick={handleDelete}>
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </ItemHeader>

      <ItemContent className="gap-4">
        <div className="flex flex-col gap-1">
          <Label className="font-semibold">{t("form.labelInput")}</Label>
          <p className="text-muted-foreground">{evaluation.input}</p>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="font-semibold">{t("form.labelExpectedOutput")}</Label>
          <p className="text-muted-foreground">{evaluation.expectedOutput}</p>
        </div>
      </ItemContent>

      <ItemFooter>
        <EvaluationReports evaluationId={evaluation.id} agents={agents} />
      </ItemFooter>
    </Item>
  )
}
