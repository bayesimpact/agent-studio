"use client"

import type { ProjectDto } from "@caseai-connect/api-contracts"
import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@caseai-connect/ui/shad/dialog"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { deleteProject } from "@/features/projects/projects.thunks"
import { useBuildPath } from "@/hooks/use-build-path"
import { useAppDispatch } from "@/store/hooks"

export function ProjectDeletor({
  project,
  onClose,
}: {
  project: ProjectDto | null
  onClose: () => void
}) {
  const navigate = useNavigate()
  const { buildPath } = useBuildPath()
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  if (!project) {
    return null
  }

  const path = buildPath("organization", { organizationId: project.organizationId })

  const onSuccess = () => {
    navigate(path, { replace: true })
    onClose()
  }

  const handleDelete = () => dispatch(deleteProject({ onSuccess }))

  return (
    <Dialog open={!!project} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("project:delete.title")}</DialogTitle>
          <DialogDescription>
            {t("project:delete.description", { name: project.name })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            {t("actions:cancel")}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            {t("actions:confirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
