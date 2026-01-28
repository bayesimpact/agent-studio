import { useTranslation } from "react-i18next"
import { selectProjectsError, selectProjectsStatus } from "@/features/projects/projects.selectors"
import { createProject } from "@/features/projects/projects.thunks"
import { ADS } from "@/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { ProjectForm } from "./ProjectForm"

interface CreateProjectFormProps {
  organizationId: string
  onSuccess?: () => void
}

export function CreateProjectForm({ organizationId, onSuccess }: CreateProjectFormProps) {
  const { t } = useTranslation("project", { keyPrefix: "createForm" })
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectProjectsStatus)
  const error = useAppSelector(selectProjectsError)

  const handleSubmit = async (data: { name: string }) => {
    dispatch(createProject({ name: data.name, organizationId }))
    onSuccess?.()
  }

  const isLoading = ADS.isLoading(status)

  return (
    <ProjectForm
      defaultName=""
      isLoading={isLoading}
      error={error}
      onSubmit={handleSubmit}
      submitLabelIdle={t("submit")}
      submitLabelLoading={t("submitting")}
    />
  )
}
