import { uploadDocument } from "@/features/documents/documents.thunks"
import { useAppDispatch } from "@/store/hooks"
import { BasicUploader } from "../FileUploader"

export function UploadDocumentButton() {
  const dispatch = useAppDispatch()
  return (
    <BasicUploader
      processFile={({ file }) => dispatch(uploadDocument({ file, sourceType: "project" }))}
    />
  )
}
