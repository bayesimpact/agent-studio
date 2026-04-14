import type { DatasetFile, EvaluationDataset } from "../features/datasets/datasets.models"
import { DatasetList } from "./files/DatasetList"
import { FileList } from "./files/FileList"

export function Dashboard({
  files,
  datasets,
}: {
  files: DatasetFile[]
  datasets: EvaluationDataset[]
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="hidden">
        <FileList files={files} />
      </div>
      <DatasetList datasets={datasets} />
    </div>
  )
}
