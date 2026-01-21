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
import { toast } from "sonner"
import { selectProjectsStatus } from "@/features/projects/projects.selectors"
import { deleteProject, listProjects } from "@/features/projects/projects.thunks"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

interface DeleteProjectDialogProps {
  project: ProjectDto | null
  organizationId: string
  onClose: () => void
}

export function DeleteProjectDialog({
  project,
  organizationId,
  onClose,
}: DeleteProjectDialogProps) {
  const dispatch = useAppDispatch()
  const projectsStatus = useAppSelector(selectProjectsStatus)

  if (!project) {
    return null
  }

  const handleDelete = async () => {
    try {
      await dispatch(deleteProject(project.id)).unwrap()
      toast.success("Project deleted successfully")
      onClose()
      dispatch(listProjects(organizationId))
    } catch (err) {
      const errorMessage = (err as { message?: string })?.message || "Failed to delete project"
      toast.error(errorMessage)
    }
  }

  return (
    <Dialog open={!!project} onOpenChange={(open) => !open && onClose()}>
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
