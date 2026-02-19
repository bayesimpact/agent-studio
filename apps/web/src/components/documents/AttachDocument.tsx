import { Button } from "@caseai-connect/ui/shad/button"
import { FileCheckIcon, PaperclipIcon, XIcon } from "lucide-react"
import { useState } from "react"
import { selectCurrentOrganizationId } from "@/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/features/projects/projects.selectors"
import { useAppSelector } from "@/store/hooks"
import { BasicUploader } from "../FileUploader"

export function AttachDocument({
  disabled,
  onAttach,
  onUnattach,
}: {
  disabled: boolean
  onAttach: (file: File) => void
  onUnattach: () => void
}) {
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)
  const [file, setFile] = useState<File>()

  if (!organizationId || !projectId) return null

  const handleProcessFile = async ({ file }: { file: File }) => {
    setFile(file)
    onAttach(file)
  }

  const handleDeleteFile = () => {
    setFile(undefined)
    onUnattach()
  }

  return (
    <div className="flex items-center gap-1">
      <BasicUploader
        organizationId={organizationId}
        projectId={projectId}
        processFile={handleProcessFile}
      >
        {(status) => {
          return (
            <Button variant="ghost" className="w-fit" disabled={disabled || status === "uploading"}>
              <PaperclipIcon />
            </Button>
          )
        }}
      </BasicUploader>
      {file && (
        <Button variant="default" onClick={handleDeleteFile}>
          <FileCheckIcon className="size-4" /> {file?.name}
          <XIcon className="size-4" />
        </Button>
      )}
    </div>
  )
}
