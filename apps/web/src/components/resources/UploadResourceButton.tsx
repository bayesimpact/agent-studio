import type { Project } from "@/features/projects/projects.models"
import { uploadResource } from "@/features/resources/resources.thunks"
import { useAppDispatch } from "@/store/hooks"
import { Uploader } from "../FileUploader"

export function UploadResourceButton({
  organizationId,
  project,
}: {
  organizationId: string
  project: Project
}) {
  const dispatch = useAppDispatch()
  const handleProcessFile = async ({ file }: { file: File }) => {
    dispatch(uploadResource({ organizationId, projectId: project.id, file }))
  }
  return (
    <Uploader
      organizationId={organizationId}
      projectId={project.id}
      processFile={handleProcessFile}
    />
  )
}
