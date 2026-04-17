import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useOutlet } from "react-router-dom"
import { GridHeader } from "@/common/components/grid/Grid"
import { Loader } from "@/common/components/Loader"
import { AsyncRoute } from "@/common/routes/AsyncRoute"
import { LoadingRoute } from "@/common/routes/LoadingRoute"
import { ADS } from "@/common/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { buildSince } from "@/common/utils/build-date"
import { EvaluationExtractionDatasetInitializer } from "../components/EvaluationExtractionDatasetInitializer"
import { EvaluationExtractionDatasetRecords } from "../components/evaluation-extraction-datasets/EvaluationExtractionDatasetRecordList"
import { EvaluationExtractionRunHistory } from "../components/extraction-runs/EvaluationExtractionRunHistory"
import { RunEvaluationExtractionDialog } from "../components/extraction-runs/RunEvaluationExtractionDialog"
import type { EvaluationExtractionDataset } from "../features/evaluation-extraction-datasets/evaluation-extraction-datasets.models"
import {
  selectCurrentDatasetData,
  selectCurrentDatasetId,
  selectIsUpdatingDataset,
} from "../features/evaluation-extraction-datasets/evaluation-extraction-datasets.selectors"
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
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const isUpdatingDataset = useAppSelector(selectIsUpdatingDataset)
  const isDatasetEmpty = Object.values(dataset.schemaMapping).length === 0
  const runsData = useAppSelector(selectEvaluationExtractionRunsData)

  useEffect(() => {
    dispatch(evaluationExtractionRunsActions.getAll())
  }, [dispatch])

  const handleBack = () => navigate(-1)

  const title = isDatasetEmpty
    ? t("evaluation:dataset.update.title", { datasetName: dataset.name })
    : dataset.name

  const description = isDatasetEmpty
    ? t("evaluation:dataset.update.description")
    : buildSince(dataset.updatedAt)

  const runs = ADS.isFulfilled(runsData)
    ? runsData.value.filter((run) => run.evaluationExtractionDatasetId === dataset.id)
    : []

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
            <EvaluationExtractionRunHistory runs={runs} />
          </div>
        )}
      </div>
    </div>
  )
}
