import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { GridHeader } from "@/common/components/grid/Grid"
import { AsyncRoute } from "@/common/routes/AsyncRoute"
import { LoadingRoute } from "@/common/routes/LoadingRoute"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { buildSince } from "@/common/utils/build-date"
import {
  EvaluationExtractionRunRecordsTable,
  EvaluationExtractionRunSummary,
} from "../components/extraction-runs/EvaluationExtractionRunResults"
import type { EvaluationExtractionDataset } from "../features/evaluation-extraction-datasets/evaluation-extraction-datasets.models"
import { selectCurrentDatasetData } from "../features/evaluation-extraction-datasets/evaluation-extraction-datasets.selectors"
import type {
  EvaluationExtractionRun,
  EvaluationExtractionRunRecord,
} from "../features/evaluation-extraction-runs/evaluation-extraction-runs.models"
import {
  selectCurrentRunData,
  selectCurrentRunRecords,
} from "../features/evaluation-extraction-runs/evaluation-extraction-runs.selectors"
import { evaluationExtractionRunsActions } from "../features/evaluation-extraction-runs/evaluation-extraction-runs.slice"

export function EvaluationExtractionRunRoute() {
  const dispatch = useAppDispatch()
  const { runId } = useParams<{ runId: string }>()
  const runData = useAppSelector(selectCurrentRunData)
  const recordsData = useAppSelector(selectCurrentRunRecords)
  const datasetData = useAppSelector(selectCurrentDatasetData)

  useEffect(() => {
    if (!runId) return
    dispatch(evaluationExtractionRunsActions.setCurrentRunId({ runId }))
    dispatch(evaluationExtractionRunsActions.getOne({ evaluationExtractionRunId: runId }))
    dispatch(evaluationExtractionRunsActions.getRecords({ evaluationExtractionRunId: runId }))
  }, [dispatch, runId])

  if (!runId) return <LoadingRoute />

  return (
    <AsyncRoute data={[runData, recordsData, datasetData]}>
      {([run, records, dataset]) => <WithData run={run} records={records} dataset={dataset} />}
    </AsyncRoute>
  )
}

function WithData({
  run,
  records,
  dataset,
}: {
  run: EvaluationExtractionRun
  records: EvaluationExtractionRunRecord[]
  dataset: EvaluationExtractionDataset
}) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleBack = () => navigate(-1)

  return (
    <div>
      <GridHeader
        title={t("evaluationExtractionRun:results.title")}
        description={buildSince(run.createdAt)}
        onBack={handleBack}
      />
      <div className="p-6 flex flex-col gap-6">
        <EvaluationExtractionRunSummary run={run} />
        <EvaluationExtractionRunRecordsTable records={records} run={run} dataset={dataset} />
      </div>
    </div>
  )
}
