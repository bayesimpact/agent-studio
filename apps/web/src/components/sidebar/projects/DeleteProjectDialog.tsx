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
import { selectProjectsStatus } from "@/features/projects/projects.selectors"
import { deleteProject } from "@/features/projects/projects.thunks"
import { useBuildPath } from "@/hooks/use-build-path"
import { ADS } from "@/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

interface DeleteProjectDialogProps {
  project: ProjectDto | null
  onClose: () => void
}

export function DeleteProjectDialog({ project, onClose }: DeleteProjectDialogProps) {
  const navigate = useNavigate()
  const { buildPath } = useBuildPath()
  const { t } = useTranslation("project", { keyPrefix: "delete" })
  const { t: tCommon } = useTranslation("common")
  const dispatch = useAppDispatch()
  const projectsStatus = useAppSelector(selectProjectsStatus)

  if (!project) {
    return null
  }

  const path = buildPath("organization", { organizationId: project.organizationId })

  const onSuccess = () => {
    navigate(path, { replace: true })
    onClose()
  }

  const handleDelete = async () => {
    dispatch(
      deleteProject({ organizationId: project.organizationId, projectId: project.id, onSuccess }),
    )
  }

  return (
    <Dialog open={!!project} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description", { name: project.name })}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={ADS.isLoading(projectsStatus)}>
            {tCommon("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={ADS.isLoading(projectsStatus)}
          >
            {ADS.isLoading(projectsStatus) ? t("submitting") : t("submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
