import { Button } from "@caseai-connect/ui/shad/button"
import { PaperclipIcon } from "lucide-react"
import { BasicUploader } from "../FileUploader"

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
    <BasicUploader processFile={handleProcessFile}>
      {(status) => {
        return (
          <Button variant="ghost" className="w-fit" disabled={disabled || status === "uploading"}>
            <PaperclipIcon />
          </Button>
        )
      }}
    </BasicUploader>
  )
}
