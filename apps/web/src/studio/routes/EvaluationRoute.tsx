import { Button } from "@caseai-connect/ui/shad/button"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import type { Agent } from "@/features/agents/agents.models"
import { selectAgentsData } from "@/features/agents/agents.selectors"
import type { Evaluation } from "@/studio/features/evaluations/evaluations.models"
import { selectEvaluationsData } from "@/studio/features/evaluations/evaluations.selectors"
import { createEvaluation } from "@/studio/features/evaluations/evaluations.thunks"
import { AsyncRoute } from "../../common/routes/AsyncRoute"
import { GridHeader } from "../components/grid/Grid"
import { EmptyEvaluation } from "../features/evaluations/components/EmptyEvaluation"
import { EvaluationCreator } from "../features/evaluations/components/EvaluationCreator"
import { EvaluationItem } from "../features/evaluations/components/EvaluationItem"
import { EvaluationRunner } from "../features/evaluations/components/EvaluationRunner"
import { useGetStudioPath } from "../hooks/use-studio-build-path"

export function EvaluationRoute() {
  const evaluations = useAppSelector(selectEvaluationsData)
  const agents = useAppSelector(selectAgentsData)

  return (
    <AsyncRoute data={[agents, evaluations]}>
      {([agentsValue, evaluationsValue]) => (
        <WithData agents={agentsValue} evaluations={evaluationsValue} />
      )}
    </AsyncRoute>
  )
}

function WithData({ agents, evaluations }: { agents: Agent[]; evaluations: Evaluation[] }) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { getStudioPath } = useGetStudioPath()
  const [idsToRun, setIdsToRun] = useState<string[]>([])

  const handleCreate = useCallback(
    (fields: Pick<Evaluation, "input" | "expectedOutput">) => {
      dispatch(createEvaluation({ fields }))
    },
    [dispatch],
  )

  const handleBack = () => {
    const path = getStudioPath("project")
    navigate(path)
  }
  return (
    <>
      <GridHeader
        onBack={handleBack}
        title={t("evaluation:evaluations")}
        description={t("evaluation:list.description")}
        action={
          <div className="flex items-center gap-2">
            <EvaluationCreator onSubmit={handleCreate} />
            <Button
              variant="outline"
              disabled={evaluations.length === 0}
              onClick={() => setIdsToRun(evaluations.map((e) => e.id))}
            >
              {t("evaluation:runAll")}
            </Button>
            <EvaluationRunner
              ids={idsToRun}
              agents={agents}
              modalHandler={{
                open: idsToRun.length > 0,
                setOpen: (open) => {
                  if (!open) setIdsToRun([])
                },
              }}
            />
          </div>
        }
      />
      {evaluations.length === 0 ? (
        <EmptyEvaluation />
      ) : (
        <div className="p-6 flex flex-col gap-4">
          {evaluations.map((evaluation) => (
            <EvaluationItem key={evaluation.id} evaluation={evaluation} agents={agents} />
          ))}
        </div>
      )}
    </>
  )
}
