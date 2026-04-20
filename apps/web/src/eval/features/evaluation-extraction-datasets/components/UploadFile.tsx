import { FileUploader } from "@/common/components/FileUploader"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { selectUploaderState } from "@/eval/features/evaluation-extraction-datasets/evaluation-extraction-datasets.selectors"
import { evaluationExtractionDatasetsActions } from "@/eval/features/evaluation-extraction-datasets/evaluation-extraction-datasets.slice"

export function UploadFile() {
  const dispatch = useAppDispatch()
  const uploaderState = useAppSelector(selectUploaderState)
  return (
    <FileUploader
      maxFiles={1}
      allowedMimeTypes={{ "text/csv": true }}
      disabled={uploaderState.status === "uploading"}
      maxSize={40 * 1024 * 1024} // 40MB
      onDropFiles={() => {}}
      onProcessEnd={() => {}}
      onProcessFiles={async (files) => {
        await dispatch(evaluationExtractionDatasetsActions.uploadFile({ file: files[0]! })).unwrap()
      }}
    />
  )
}
