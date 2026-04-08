import { allowedDocumentUploadMimeTypesForFileUploader } from "@caseai-connect/api-contracts"
import { Button } from "@caseai-connect/ui/shad/button"
import { PaperclipIcon } from "lucide-react"
import { FileUploader } from "@/common/components/FileUploader"

export function AttachDocument({
  disabled,
  onAttach,
}: {
  disabled: boolean
  onAttach: (file: File) => void
}) {
  const handleProcessFiles = (files: File[]) => {
    onAttach(files[0]!)
  }
  return (
    <FileUploader
      onDropFiles={handleProcessFiles}
      allowedMimeTypes={allowedDocumentUploadMimeTypesForFileUploader}
      maxFiles={1}
      shouldRun={false}
    >
      <Button variant="ghost" className="w-fit" disabled={disabled}>
        <PaperclipIcon />
      </Button>
    </FileUploader>
  )
}
