import type { ProjectDto } from "@caseai-connect/api-contracts"
import { useTranslation } from "react-i18next"
import { selectProjectsError, selectProjectsStatus } from "@/features/projects/projects.selectors"
import { updateProject } from "@/features/projects/projects.thunks"
import { ADS } from "@/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { ProjectForm } from "./ProjectForm"

interface UpdateProjectFormProps {
  project: ProjectDto
  onSuccess?: () => void
}

export function UpdateProjectForm({ project, onSuccess }: UpdateProjectFormProps) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectProjectsStatus)
  const error = useAppSelector(selectProjectsError)

  const handleSubmit = async (data: { name: string }) => {
    dispatch(updateProject({ projectId: project.id, payload: { name: data.name } }))
    onSuccess?.()
  }

  return (
    <ProjectForm
      defaultName={project.name}
      isLoading={ADS.isLoading(status)}
      error={error}
      onSubmit={handleSubmit}
      submitLabelIdle={t("project.update.submit")}
      submitLabelLoading={t("project.update.submitting")}
    />
  )
}
