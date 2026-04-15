import { FileUploader } from "@/common/components/FileUploader"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { selectUploaderState } from "@/eval/features/datasets/datasets.selectors"
import { datasetsActions } from "@/eval/features/datasets/datasets.slice"

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
        await dispatch(datasetsActions.uploadFile({ file: files[0]! })).unwrap()
      }}
    />
  )
}
