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
import { UpdateProjectForm } from "@/components/projects/UpdateProjectForm"

interface EditProjectDialogProps {
  project: ProjectDto | null
  onClose: () => void
}

export function EditProjectDialog({ project, onClose }: EditProjectDialogProps) {
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
        <UpdateProjectForm project={project} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}
