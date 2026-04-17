import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { GridHeader } from "@/common/components/grid/Grid"
import { AsyncRoute } from "@/common/routes/AsyncRoute"
import { LoadingRoute } from "@/common/routes/LoadingRoute"
import { ADS } from "@/common/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { buildSince } from "@/common/utils/build-date"
import {
  EvaluationExtractionRunRecordsTable,
  EvaluationExtractionRunSummary,
} from "../components/extraction-runs/EvaluationExtractionRunResults"
import type {
  EvaluationExtractionDataset,
  EvaluationExtractionDatasetRecordRow,
} from "../features/evaluation-extraction-datasets/evaluation-extraction-datasets.models"
import {
  selectCurrentDatasetData,
  selectRecordsData,
} from "../features/evaluation-extraction-datasets/evaluation-extraction-datasets.selectors"
import { evaluationExtractionDatasetsActions } from "../features/evaluation-extraction-datasets/evaluation-extraction-datasets.slice"
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
  const datasetRecordsData = useAppSelector(selectRecordsData)

  const datasetId = ADS.isFulfilled(datasetData) ? datasetData.value.id : null

  useEffect(() => {
    if (!runId) return
    dispatch(evaluationExtractionRunsActions.setCurrentRunId({ runId }))
    dispatch(evaluationExtractionRunsActions.getOne({ evaluationExtractionRunId: runId }))
    dispatch(evaluationExtractionRunsActions.getRecords({ evaluationExtractionRunId: runId }))
    dispatch(evaluationExtractionRunsActions.startRunStatusStream())

    return () => {
      dispatch(evaluationExtractionRunsActions.stopRunStatusStream())
    }
  }, [dispatch, runId])

  useEffect(() => {
    if (!datasetId) return
    dispatch(
      evaluationExtractionDatasetsActions.listRecords({
        datasetId,
        page: 0,
        limit: 10000,
      }),
    )
  }, [dispatch, datasetId])

  if (!runId) return <LoadingRoute />

  const datasetRecords = ADS.isFulfilled(datasetRecordsData) ? datasetRecordsData.value.records : []

  return (
    <AsyncRoute data={[runData, recordsData, datasetData]}>
      {([run, records, dataset]) => (
        <WithData run={run} records={records} dataset={dataset} datasetRecords={datasetRecords} />
      )}
    </AsyncRoute>
  )
}

function WithData({
  run,
  records,
  dataset,
  datasetRecords,
}: {
  run: EvaluationExtractionRun
  records: EvaluationExtractionRunRecord[]
  dataset: EvaluationExtractionDataset
  datasetRecords: EvaluationExtractionDatasetRecordRow[]
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
        <EvaluationExtractionRunRecordsTable
          records={records}
          run={run}
          dataset={dataset}
          datasetRecords={datasetRecords}
        />
      </div>
    </div>
  )
}
