import type { ProjectDto } from "@caseai-connect/api-contracts"
import { toast } from "sonner"
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
    try {
      await dispatch(
        updateProject({ projectId: project.id, payload: { name: data.name } }),
      ).unwrap()
      toast.success("Project updated successfully!")
      onSuccess?.()
    } catch (err) {
      const errorMessage = (err as { message?: string })?.message || "Failed to update project"
      toast.error(errorMessage)
    }
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
