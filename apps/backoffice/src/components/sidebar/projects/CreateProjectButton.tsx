"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@caseai-connect/ui/shad/dialog"
import { SidebarMenuButton, SidebarMenuItem } from "@caseai-connect/ui/shad/sidebar"
import { Plus } from "lucide-react"
import { CreateProjectForm } from "@/components/projects/CreateProjectForm"
import { listProjects } from "@/features/projects/projects.thunks"
import { useAppDispatch } from "@/store/hooks"

interface CreateProjectButtonProps {
  organizationId: string
  organizationName: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProjectButton({
  organizationId,
  organizationName,
  isOpen,
  onOpenChange,
}: CreateProjectButtonProps) {
  const dispatch = useAppDispatch()

  const handleSuccess = () => {
    onOpenChange(false)
    dispatch(listProjects(organizationId))
  }

  return (
    <SidebarMenuItem>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <SidebarMenuButton tooltip="Create Project">
            <Plus />
            <span>Create Project</span>
          </SidebarMenuButton>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Create a new project for {organizationName}</DialogDescription>
          </DialogHeader>
          <CreateProjectForm organizationId={organizationId} onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>
    </SidebarMenuItem>
  )
}
