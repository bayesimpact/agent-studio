import { allowedDocumentUploadMimeTypesForFileUploader } from "@caseai-connect/api-contracts"
import { selectUploaderState } from "@/features/documents/documents.selectors"
import { uploadDocuments } from "@/features/documents/documents.thunks"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { FileUploader } from "../FileUploader"

export function UploadDocumentsButton() {
  const dispatch = useAppDispatch()
  const uploaderState = useAppSelector(selectUploaderState)
  return (
    <FileUploader
      allowedMimeTypes={allowedDocumentUploadMimeTypesForFileUploader}
      maxFiles={400}
      disabled={uploaderState.status === "uploading"}
      maxSize={40 * 1024 * 1024} // 40MB
      onProcessFiles={async (files) => {
        await dispatch(uploadDocuments({ files, sourceType: "project" })).unwrap()
      }}
    />
  )
}
