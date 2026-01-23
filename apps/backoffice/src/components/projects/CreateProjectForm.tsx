import { toast } from "sonner"
import { selectProjectsError, selectProjectsStatus } from "@/features/projects/projects.selectors"
import { createProject } from "@/features/projects/projects.thunks"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { ProjectForm } from "./ProjectForm"

interface CreateProjectFormProps {
  organizationId: string
  onSuccess?: () => void
}

export function CreateProjectForm({ organizationId, onSuccess }: CreateProjectFormProps) {
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectProjectsStatus)
  const error = useAppSelector(selectProjectsError)

  const handleSubmit = async (data: { name: string }) => {
    try {
      await dispatch(createProject({ name: data.name, organizationId })).unwrap()
      toast.success("Project created successfully!")
      onSuccess?.()
    } catch (err) {
      const errorMessage = (err as { message?: string })?.message || "Failed to create project"
      toast.error(errorMessage)
    }
  }

  const isLoading = status === "loading"

  return (
    <ProjectForm
      defaultName=""
      isLoading={isLoading}
      error={error}
      onSubmit={handleSubmit}
      submitLabelIdle="Create Project"
      submitLabelLoading="Creating..."
    />
  )
}
