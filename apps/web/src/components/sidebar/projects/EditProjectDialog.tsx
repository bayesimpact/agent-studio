"use client"

import type { ProjectDto } from "@caseai-connect/api-contracts"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@caseai-connect/ui/shad/dialog"
import { UpdateProjectForm } from "@/components/projects/UpdateProjectForm"

interface EditProjectDialogProps {
  project: ProjectDto | null
  onClose: () => void
}

export function EditProjectDialog({ project, onClose }: EditProjectDialogProps) {
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
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Update the project name</DialogDescription>
        </DialogHeader>
        <UpdateProjectForm project={project} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}
