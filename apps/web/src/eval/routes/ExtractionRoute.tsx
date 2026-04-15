import { useEffect } from "react"
import { useOutlet } from "react-router-dom"
import { AsyncRoute } from "@/common/routes/AsyncRoute"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { DatasetList } from "../components/files/DatasetList"
import type { EvaluationDataset } from "../features/datasets/datasets.models"
import { selectDatasetsData, selectFilesData } from "../features/datasets/datasets.selectors"
import { datasetsActions } from "../features/datasets/datasets.slice"

export function ExtractionRoute() {
  const dispatch = useAppDispatch()
  const filesData = useAppSelector(selectFilesData)
  const datasetsData = useAppSelector(selectDatasetsData)
  // FIXME: should listen isInitDone from store instead
  useEffect(() => {
    dispatch(datasetsActions.initData())
  }, [dispatch])
  return (
    <AsyncRoute data={[filesData, datasetsData]}>
      {([_filesValue, datasetsValue]) => <WithData datasets={datasetsValue} />}
    </AsyncRoute>
  )
}

function WithData({ datasets }: { datasets: EvaluationDataset[] }) {
  const outlet = useOutlet()
  if (outlet) return outlet
  return <DatasetList datasets={datasets} />
}
