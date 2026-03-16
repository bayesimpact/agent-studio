import { uploadDocument } from "@/features/documents/documents.thunks"
import { useAppDispatch } from "@/store/hooks"
import { FileUploader } from "../FileUploader"

export function UploadDocumentButton() {
  const dispatch = useAppDispatch()
  return (
    <FileUploader
      processFile={({ file }) => dispatch(uploadDocument({ file, sourceType: "project" }))}
      allowedMimeTypes={{ pdf: true }}
    />
  )
}
