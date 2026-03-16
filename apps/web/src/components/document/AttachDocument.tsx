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
  const handleProcessFile = async ({ file }: { file: File }) => {
    onAttach(file)
  }
  return (
    <FileUploader
      processFile={handleProcessFile}
      allowedMimeTypes={{ pdf: true, png: true, jpeg: true }}
    >
      {(status) => {
        return (
          <Button variant="ghost" className="w-fit" disabled={disabled || status === "uploading"}>
            <PaperclipIcon />
          </Button>
        )
      }}
    </FileUploader>
  )
}
