"use client"

import type { ProjectDto } from "@caseai-connect/api-contracts"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@caseai-connect/ui/shad/dialog"
import { useTranslation } from "react-i18next"
import { updateProject } from "@/features/projects/projects.thunks"
import { useAppDispatch } from "@/store/hooks"
import { ProjectForm } from "./ProjectForm"

export function ProjectEditor({
  project,
  onClose,
}: {
  project: ProjectDto | null
  onClose: () => void
}) {
  const { t } = useTranslation("project", { keyPrefix: "update" })
  if (!project) {
    return null
  }

  const handleSuccess = () => {
    onClose()
  }

  return (
    <Dialog open={!!project} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <UpdateForm project={project} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}

function UpdateForm({ project, onSuccess }: { project: ProjectDto; onSuccess?: () => void }) {
  const dispatch = useAppDispatch()
  const handleSubmit = async (data: { name: string }) => {
    dispatch(updateProject({ payload: { name: data.name } }))
    onSuccess?.()
  }
  return <ProjectForm editableProject={project} onSubmit={handleSubmit} />
}
