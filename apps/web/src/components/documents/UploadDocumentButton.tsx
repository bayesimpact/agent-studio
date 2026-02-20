import { uploadDocument } from "@/features/documents/documents.thunks"
import type { Project } from "@/features/projects/projects.models"
import { useAppDispatch } from "@/store/hooks"
import { BasicUploader } from "../FileUploader"

export function UploadDocumentButton({
  organizationId,
  project,
}: {
  organizationId: string
  project: Project
}) {
  const dispatch = useAppDispatch()
  const handleProcessFile = async ({ file }: { file: File }) => {
    dispatch(uploadDocument({ organizationId, projectId: project.id, file, sourceType: "project" }))
  }
  return (
    <BasicUploader
      organizationId={organizationId}
      projectId={project.id}
      processFile={handleProcessFile}
    />
  )
}
