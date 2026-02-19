import { Button } from "@caseai-connect/ui/shad/button"
import { PaperclipIcon } from "lucide-react"
import { selectCurrentOrganizationId } from "@/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/features/projects/projects.selectors"
import { useAppSelector } from "@/store/hooks"
import { BasicUploader } from "../FileUploader"

export function AttachDocument({
  disabled,
  onAttach,
}: {
  disabled: boolean
  onAttach: (file: File) => void
}) {
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)

  if (!organizationId || !projectId) return null

  const handleProcessFile = async ({ file }: { file: File }) => {
    onAttach(file)
  }

  return (
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
  )
}
