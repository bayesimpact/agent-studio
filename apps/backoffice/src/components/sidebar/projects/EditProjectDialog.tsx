"use client"

import type { ProjectDto } from "@caseai-connect/api-contracts"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@caseai-connect/ui/shad/dialog"
import { CreateProjectForm } from "@/components/CreateProjectForm"
import { listProjects } from "@/features/projects/projects.thunks"
import { useAppDispatch } from "@/store/hooks"

interface EditProjectDialogProps {
  project: ProjectDto | null
  organizationId: string
  onClose: () => void
}

export function EditProjectDialog({ project, organizationId, onClose }: EditProjectDialogProps) {
  const dispatch = useAppDispatch()

  if (!project) {
    return null
  }

  const handleSuccess = () => {
    onClose()
    dispatch(listProjects(organizationId))
  }

  return (
    <Dialog open={!!project} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Update the project name</DialogDescription>
        </DialogHeader>
        <CreateProjectForm
          organizationId={organizationId}
          project={project}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}
