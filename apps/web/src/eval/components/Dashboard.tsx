import type { DatasetFile } from "../features/datasets/datasets.models"
import { FileList } from "./files/FileList"

export function Dashboard({ files }: { files: DatasetFile[] }) {
  return (
    <div>
      <FileList files={files} />
    </div>
  )
}
