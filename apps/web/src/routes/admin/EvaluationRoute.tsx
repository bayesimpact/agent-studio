import { useState } from "react"
import { EvaluationCreator } from "@/components/evaluation/EvaluationCreator"
import { EvaluationRunner } from "@/components/evaluation/EvaluationRunner"
import { EvaluationsTable } from "@/components/evaluation/table/EvaluationsTable"
import type { Agent } from "@/features/agents/agents.models"
import { selectAgentsFromProjectId } from "@/features/agents/agents.selectors"
import type { Evaluation } from "@/features/evaluations/evaluations.models"
import { selectCurrentEvaluationsData } from "@/features/evaluations/evaluations.selectors"
import { createEvaluation, deleteEvaluation } from "@/features/evaluations/evaluations.thunks"
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
  const dispatch = useAppDispatch()

  const [idsToRun, setIdsToRun] = useState<string[]>([])

  const data = evaluations
    .map((evaluation) => ({
      // TODO: build from reports
      id: evaluation.id,
      input: evaluation.input,
      expectedOutput: evaluation.expectedOutput,
      output: "",
      status: "pending",
      score: "-",
    }))
    .sort((a, b) => a.input.toString().localeCompare(b.input.toString()))

  const handleRun = (ids: string[]) => {
    setIdsToRun(ids)
  }
  const handleDelete = (evaluationId: string) => {
    dispatch(deleteEvaluation({ evaluationId }))
  }
  const handleEdit = (id: string) => {
    // TODO: open edit modal
    console.warn("AJ: edit", id)
  }
  const handleCreate = (fields: Pick<Evaluation, "input" | "expectedOutput">) => {
    dispatch(createEvaluation({ fields }))
  }
  return (
    <div className="p-6">
      <EvaluationsTable
        onRunSelected={handleRun}
        onDelete={handleDelete}
        onEdit={handleEdit}
        key={data.length}
        data={data}
      >
        <EvaluationCreator onSubmit={handleCreate} />
      </EvaluationsTable>

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
  )
}
