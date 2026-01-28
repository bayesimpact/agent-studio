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
import { selectProjectsStatus } from "@/features/projects/projects.selectors"
import { deleteProject } from "@/features/projects/projects.thunks"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

interface DeleteProjectDialogProps {
  project: ProjectDto | null
  onClose: () => void
}

export function DeleteProjectDialog({ project, onClose }: DeleteProjectDialogProps) {
  const dispatch = useAppDispatch()
  const projectsStatus = useAppSelector(selectProjectsStatus)

  if (!project) {
    return null
  }

  const handleDelete = async () => {
    dispatch(deleteProject({ projectId: project.id }))
    onClose()
  }

  return (
    <Dialog open={!!project} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Project</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{project.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={projectsStatus === "loading"}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={projectsStatus === "loading"}
          >
            {projectsStatus === "loading" ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
