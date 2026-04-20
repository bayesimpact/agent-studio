import { Button } from "@caseai-connect/ui/shad/button"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { GridHeader } from "@/common/components/grid/Grid"
import { AsyncRoute } from "@/common/routes/AsyncRoute"
import { LoadingRoute } from "@/common/routes/LoadingRoute"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { buildSince } from "@/common/utils/build-date"
import { DocumentOpener } from "@/studio/features/documents/components/DocumentOpener"
import type { EvaluationExtractionDataset } from "../features/evaluation-extraction-datasets/evaluation-extraction-datasets.models"
import { selectCurrentDatasetData } from "../features/evaluation-extraction-datasets/evaluation-extraction-datasets.selectors"
import {
  EvaluationExtractionRunRecordsTable,
  EvaluationExtractionRunSummary,
} from "../features/evaluation-extraction-runs/components/EvaluationExtractionRunResults"
import type { EvaluationExtractionRun } from "../features/evaluation-extraction-runs/evaluation-extraction-runs.models"
import {
  selectCurrentRunData,
  selectCurrentRunId,
  selectIsCancelling,
} from "../features/evaluation-extraction-runs/evaluation-extraction-runs.selectors"
import { evaluationExtractionRunsActions } from "../features/evaluation-extraction-runs/evaluation-extraction-runs.slice"

export function EvaluationExtractionRunRoute() {
  const dispatch = useAppDispatch()
  const runId = useAppSelector(selectCurrentRunId)
  const runData = useAppSelector(selectCurrentRunData)
  const datasetData = useAppSelector(selectCurrentDatasetData)

  useEffect(() => {
    dispatch(evaluationExtractionRunsActions.mount())
    return () => {
      dispatch(evaluationExtractionRunsActions.unmount())
    }
  }, [dispatch])

  if (!runId) return <LoadingRoute />
  return (
    <AsyncRoute data={[runData, datasetData]}>
      {([run, dataset]) => <WithData run={run} dataset={dataset} />}
    </AsyncRoute>
  )
}

function WithData({
  run,
  dataset,
}: {
  run: EvaluationExtractionRun
  dataset: EvaluationExtractionDataset
}) {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const isCancelling = useAppSelector(selectIsCancelling)

  const handleBack = () => navigate(-1)
  const canCancel = run.status === "pending" || run.status === "running"
  const handleCancel = () => {
    dispatch(evaluationExtractionRunsActions.cancelOne({ evaluationExtractionRunId: run.id }))
  }

  return (
    <div>
      <GridHeader
        title={t("evaluationExtractionRun:results.title")}
        description={buildSince(run.createdAt)}
        onBack={handleBack}
        action={
          canCancel ? (
            <Button variant="outline" onClick={handleCancel} disabled={isCancelling}>
              {t("evaluationExtractionRun:results.cancel")}
            </Button>
          ) : run.csvExportDocumentId ? (
            <DocumentOpener documentId={run.csvExportDocumentId} />
          ) : undefined
        }
      />
      <div className="p-6 flex flex-col gap-6">
        <EvaluationExtractionRunSummary run={run} />
        <EvaluationExtractionRunRecordsTable run={run} dataset={dataset} />
      </div>
    </div>
  )
}
