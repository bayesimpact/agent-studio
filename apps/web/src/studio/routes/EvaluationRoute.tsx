import { Button } from "@caseai-connect/ui/shad/button"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import type { Agent } from "@/features/agents/agents.models"
import { selectAgentsData } from "@/features/agents/agents.selectors"
import type { Evaluation } from "@/studio/features/evaluations/evaluations.models"
import { selectEvaluationsData } from "@/studio/features/evaluations/evaluations.selectors"
import { createEvaluation } from "@/studio/features/evaluations/evaluations.thunks"
import { AsyncRoute } from "../../common/routes/AsyncRoute"
import { EmptyEvaluation } from "../features/evaluations/components/EmptyEvaluation"
import { EvaluationCreator } from "../features/evaluations/components/EvaluationCreator"
import { EvaluationItem } from "../features/evaluations/components/EvaluationItem"
import { EvaluationRunner } from "../features/evaluations/components/EvaluationRunner"

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
  useHandleHeader({ evaluations, agents })
  return (
    <>
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

function useHandleHeader({ evaluations, agents }: { evaluations: Evaluation[]; agents: Agent[] }) {
  const dispatch = useAppDispatch()
  const { t } = useTranslation("evaluation")
  const [idsToRun, setIdsToRun] = useState<string[]>([])
  const { setHeaderRightSlot } = useSidebarLayout()
  const handleCreate = useCallback(
    (fields: Pick<Evaluation, "input" | "expectedOutput">) => {
      dispatch(createEvaluation({ fields }))
    },
    [dispatch],
  )

  const header = (
    <>
      <EvaluationCreator onSubmit={handleCreate} />
      <Button
        variant="default"
        disabled={evaluations.length === 0}
        onClick={() => setIdsToRun(evaluations.map((e) => e.id))}
      >
        {t("runAll")}
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
    </>
  )

  useEffect(() => {
    setHeaderRightSlot(header)
    return () => {
      setHeaderRightSlot(undefined)
    }
  }, [setHeaderRightSlot, header])
}
