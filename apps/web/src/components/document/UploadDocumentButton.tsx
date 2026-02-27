import { uploadDocument } from "@/features/documents/documents.thunks"
import { useAppDispatch } from "@/store/hooks"
import { BasicUploader } from "../FileUploader"

export function UploadDocumentButton() {
  const dispatch = useAppDispatch()
  const handleProcessFile = async ({ file }: { file: File }) => {
    dispatch(uploadDocument({ file, sourceType: "project" }))
  }
  return <BasicUploader processFile={handleProcessFile} />
}
