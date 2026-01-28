import type { ProjectDto } from "@caseai-connect/api-contracts"
import { selectProjectsError, selectProjectsStatus } from "@/features/projects/projects.selectors"
import { updateProject } from "@/features/projects/projects.thunks"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { ProjectForm } from "./ProjectForm"

interface UpdateProjectFormProps {
  project: ProjectDto
  onSuccess?: () => void
}

export function UpdateProjectForm({ project, onSuccess }: UpdateProjectFormProps) {
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectProjectsStatus)
  const error = useAppSelector(selectProjectsError)

  const handleSubmit = async (data: { name: string }) => {
    dispatch(updateProject({ projectId: project.id, payload: { name: data.name } }))
    onSuccess?.()
  }

  const isLoading = status === "loading"

  return (
    <ProjectForm
      defaultName={project.name}
      isLoading={isLoading}
      error={error}
      onSubmit={handleSubmit}
      submitLabelIdle="Update Project"
      submitLabelLoading="Updating..."
    />
  )
}
