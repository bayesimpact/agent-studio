import { Button } from "@caseai-connect/ui/shad/button"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { EmptyEvaluation } from "@/components/evaluation/EmptyEvaluation"
import { EvaluationCreator } from "@/components/evaluation/EvaluationCreator"
import { EvaluationItem } from "@/components/evaluation/EvaluationItem"
import { EvaluationRunner } from "@/components/evaluation/EvaluationRunner"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import type { Agent } from "@/features/agents/agents.models"
import { selectAgentsFromProjectId } from "@/features/agents/agents.selectors"
import type { Evaluation } from "@/features/evaluations/evaluations.models"
import { selectCurrentEvaluationsData } from "@/features/evaluations/evaluations.selectors"
import { createEvaluation } from "@/features/evaluations/evaluations.thunks"
import {
  selectCurrentProjectData,
  selectCurrentProjectId,
} from "@/features/projects/projects.selectors"
import { ADS } from "@/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { ErrorRoute } from "../ErrorRoute"
import { LoadingRoute } from "../LoadingRoute"

export function EvaluationRoute() {
  const projectId = useAppSelector(selectCurrentProjectId)
  const project = useAppSelector(selectCurrentProjectData)
  const evaluations = useAppSelector(selectCurrentEvaluationsData)

  const agents = useAppSelector(selectAgentsFromProjectId(project.value?.id))
  if (!projectId) return <ErrorRoute error="Missing valid project ID" />

  if (ADS.isError(evaluations) || ADS.isError(project) || ADS.isError(agents))
    return (
      <ErrorRoute error={evaluations.error || project.error || agents.error || "Unknown error"} />
    )

  if (ADS.isFulfilled(evaluations) && ADS.isFulfilled(project) && ADS.isFulfilled(agents))
    return <WithData agents={agents.value} evaluations={evaluations.value} />

  return <LoadingRoute />
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
        {t("table.buttons.runAll")}
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
