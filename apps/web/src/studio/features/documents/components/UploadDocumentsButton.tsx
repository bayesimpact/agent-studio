import { allowedDocumentUploadMimeTypesForFileUploader } from "@caseai-connect/api-contracts"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { FileUploader } from "@/components/FileUploader"
import { selectUploaderState } from "@/studio/features/documents/documents.selectors"
import { uploadDocuments } from "@/studio/features/documents/documents.thunks"

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
