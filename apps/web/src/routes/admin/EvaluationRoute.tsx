import { useState } from "react"
import {
  EvaluationCreator,
  type EvaluationFormData,
} from "@/components/evaluation/EvaluationCreator"
import { EvaluationRunner } from "@/components/evaluation/EvaluationRunner"
import { EvaluationsTable } from "@/components/evaluation/table/EvaluationsTable"
import { selectAgentsFromProjectId } from "@/features/agents/agents.selectors"
import { selectDocumentsFromProjectId } from "@/features/documents/documents.selectors"
import type { Project } from "@/features/projects/projects.models"
import {
  selectCurrentProjectData,
  selectCurrentProjectId,
} from "@/features/projects/projects.selectors"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { generateId } from "@/utils/generate-id"
import { ErrorRoute } from "../ErrorRoute"
import { LoadingRoute } from "../LoadingRoute"

export function EvaluationRoute() {
  const projectId = useAppSelector(selectCurrentProjectId)
  const project = useAppSelector(selectCurrentProjectData)
  const documentsData = useAppSelector(selectDocumentsFromProjectId(projectId))
  if (!projectId) return <ErrorRoute error="Missing valid project ID" />

  if (ADS.isError(documentsData) || ADS.isError(project))
    return <ErrorRoute error={documentsData.error || project.error || "Unknown error"} />

  if (ADS.isFulfilled(documentsData) && ADS.isFulfilled(project))
    return <WithData project={project.value} />

  return <LoadingRoute />
}

function WithData({ project }: { project: Project }) {
  const agents = useAppSelector(selectAgentsFromProjectId(project.id))
  const [idsToRun, setIdsToRun] = useState<string[]>([])
  const [evaluations, setEvaluations] = useState<(EvaluationFormData & { id: string })[]>([])

  const data = evaluations
    .map((evaluation) => ({
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
  const handleDelete = (id: string) => {
    setEvaluations((prev) => prev.filter((evaluation) => evaluation.id !== id))
  }
  const handleEdit = (id: string) => {
    // TODO: open edit modal
    console.warn("AJ: edit", id)
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
        <EvaluationCreator
          onSubmit={(evaluation) =>
            setEvaluations((prev) => [...prev, { ...evaluation, id: generateId() }])
          }
        />
      </EvaluationsTable>

      {ADS.isFulfilled(agents) && (
        <EvaluationRunner
          ids={idsToRun}
          agents={agents.value}
          modalHandler={{
            open: idsToRun.length > 0,
            setOpen: (open) => {
              if (!open) setIdsToRun([])
            },
          }}
        />
      )}
    </div>
  )
}
