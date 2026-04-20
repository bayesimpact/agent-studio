import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useOutlet } from "react-router-dom"
import { GridHeader } from "@/common/components/grid/Grid"
import { Loader } from "@/common/components/Loader"
import { AsyncRoute } from "@/common/routes/AsyncRoute"
import { LoadingRoute } from "@/common/routes/LoadingRoute"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { buildSince } from "@/common/utils/build-date"
import { EvaluationExtractionDatasetInitializer } from "../features/evaluation-extraction-datasets/components/EvaluationExtractionDatasetInitializer"
import { EvaluationExtractionDatasetRecords } from "../features/evaluation-extraction-datasets/components/EvaluationExtractionDatasetRecordList"
import type { EvaluationExtractionDataset } from "../features/evaluation-extraction-datasets/evaluation-extraction-datasets.models"
import {
  selectCurrentDatasetData,
  selectCurrentDatasetId,
  selectIsUpdatingDataset,
} from "../features/evaluation-extraction-datasets/evaluation-extraction-datasets.selectors"
import { EvaluationExtractionRunHistory } from "../features/evaluation-extraction-runs/components/EvaluationExtractionRunHistory"
import { RunEvaluationExtractionDialog } from "../features/evaluation-extraction-runs/components/RunEvaluationExtractionDialog"
import { selectEvaluationExtractionRunsData } from "../features/evaluation-extraction-runs/evaluation-extraction-runs.selectors"
import { evaluationExtractionRunsActions } from "../features/evaluation-extraction-runs/evaluation-extraction-runs.slice"

export function EvaluationExtractionDatasetRoute() {
  const datasetId = useAppSelector(selectCurrentDatasetId)
  const dataset = useAppSelector(selectCurrentDatasetData)
  const outlet = useOutlet()

  if (outlet) return outlet

  if (!datasetId) return <LoadingRoute />
  return (
    <AsyncRoute data={[dataset]}>
      {([datasetValue]) => <WithData dataset={datasetValue} />}
    </AsyncRoute>
  )
}

function WithData({ dataset }: { dataset: EvaluationExtractionDataset }) {
  const navigate = useNavigate()

  const { t } = useTranslation()
  const isUpdatingDataset = useAppSelector(selectIsUpdatingDataset)
  const isDatasetEmpty = Object.values(dataset.schemaMapping).length === 0

  const handleBack = () => navigate(-1)

  const title = isDatasetEmpty
    ? t("evaluation:dataset.update.title", { datasetName: dataset.name })
    : dataset.name

  const description = isDatasetEmpty
    ? t("evaluation:dataset.update.description")
    : buildSince(dataset.updatedAt)

  return (
    <div>
      <GridHeader
        title={title}
        description={description}
        onBack={handleBack}
        action={!isDatasetEmpty ? <RunEvaluationExtractionDialog dataset={dataset} /> : undefined}
      />

      <div className="p-6">
        {isUpdatingDataset ? (
          <Loader />
        ) : isDatasetEmpty ? (
          <EvaluationExtractionDatasetInitializer dataset={dataset} />
        ) : (
          <div className="flex flex-col gap-6">
            <EvaluationExtractionDatasetRecords dataset={dataset} />
            <RunList datasetId={dataset.id} />
          </div>
        )}
      </div>
    </div>
  )
}

function RunList({ datasetId }: { datasetId: string }) {
  const dispatch = useAppDispatch()
  const runsData = useAppSelector(selectEvaluationExtractionRunsData)

  useEffect(() => {
    // TODO: use mount/unmount actions
    dispatch(evaluationExtractionRunsActions.getAll())
  }, [dispatch])

  return (
    <AsyncRoute data={[runsData]}>
      {([runsDataValue]) => (
        <EvaluationExtractionRunHistory
          runs={runsDataValue.filter((run) => run.evaluationExtractionDatasetId === datasetId)}
        />
      )}
    </AsyncRoute>
  )
}
