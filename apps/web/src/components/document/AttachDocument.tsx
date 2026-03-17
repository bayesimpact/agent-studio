import { Button } from "@caseai-connect/ui/shad/button"
import { PaperclipIcon } from "lucide-react"
import { FileUploader } from "../FileUploader"

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
      allowedMimeTypes={{
        "application/pdf": true,
        "image/png": true,
        "image/jpeg": true,
      }}
      maxFiles={1}
      shouldRun={false}
    >
      <Button variant="ghost" className="w-fit" disabled={disabled}>
        <PaperclipIcon />
      </Button>
    </FileUploader>
  )
}
