import { useEffect } from "react"
import { useOutlet } from "react-router-dom"
import { AsyncRoute } from "@/common/routes/AsyncRoute"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { EvaluationExtractionDatasetList } from "../features/evaluation-extraction-datasets/components/EvaluationExtractionDatasetList"
import type { EvaluationExtractionDataset } from "../features/evaluation-extraction-datasets/evaluation-extraction-datasets.models"
import {
  selectDatasetsData,
  selectFilesData,
} from "../features/evaluation-extraction-datasets/evaluation-extraction-datasets.selectors"
import { evaluationExtractionDatasetsActions } from "../features/evaluation-extraction-datasets/evaluation-extraction-datasets.slice"

export function EvaluationExtractionDatasetsRoute() {
  const dispatch = useAppDispatch()
  const filesData = useAppSelector(selectFilesData)
  const datasetsData = useAppSelector(selectDatasetsData)
  useEffect(() => {
    // TODO: use mount/unmount actions
    dispatch(evaluationExtractionDatasetsActions.initData())
  }, [dispatch])
  return (
    <AsyncRoute data={[filesData, datasetsData]}>
      {([_filesValue, datasetsValue]) => <WithData datasets={datasetsValue} />}
    </AsyncRoute>
  )
}

function WithData({ datasets }: { datasets: EvaluationExtractionDataset[] }) {
  const outlet = useOutlet()
  if (outlet) return outlet
  return <EvaluationExtractionDatasetList datasets={datasets} />
}
