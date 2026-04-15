import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { GridHeader } from "@/common/components/grid/Grid"
import { Loader } from "@/common/components/Loader"
import { AsyncRoute } from "@/common/routes/AsyncRoute"
import { LoadingRoute } from "@/common/routes/LoadingRoute"
import { useAppSelector } from "@/common/store/hooks"
import { buildSince } from "@/common/utils/build-date"
import { DatasetInitializer } from "../components/DatasetInitializer"
import { DatasetRecords } from "../components/files/DatasetRecodList"
import type { EvaluationDataset } from "../features/datasets/datasets.models"
import {
  selectCurrentDatasetData,
  selectCurrentDatasetId,
  selectIsUpdatingDataset,
} from "../features/datasets/datasets.selectors"

export function DatasetRoute() {
  const datasetId = useAppSelector(selectCurrentDatasetId)
  const dataset = useAppSelector(selectCurrentDatasetData)

  if (!datasetId) return <LoadingRoute />
  return (
    <AsyncRoute data={[dataset]}>
      {([datasetValue]) => <WithData dataset={datasetValue} />}
    </AsyncRoute>
  )
}

function WithData({ dataset }: { dataset: EvaluationDataset }) {
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
      <GridHeader title={title} description={description} onBack={handleBack} />

      <div className="p-6">
        {isUpdatingDataset ? (
          <Loader />
        ) : isDatasetEmpty ? (
          <DatasetInitializer dataset={dataset} />
        ) : (
          <DatasetRecords dataset={dataset} />
        )}
      </div>
    </div>
  )
}
