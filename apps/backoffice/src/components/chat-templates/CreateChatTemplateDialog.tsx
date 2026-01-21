"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@caseai-connect/ui/shad/dialog"
import { listChatTemplates } from "@/features/chat-templates/chat-templates.thunks"
import { useAppDispatch } from "@/store/hooks"
import { CreateChatTemplateForm } from "./CreateChatTemplateForm"

interface CreateChatTemplateDialogProps {
  projectId: string
  projectName: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateChatTemplateDialog({
  projectId,
  projectName,
  isOpen,
  onOpenChange,
}: CreateChatTemplateDialogProps) {
  const dispatch = useAppDispatch()

  const handleSuccess = () => {
    onOpenChange(false)
    dispatch(listChatTemplates(projectId))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Chat Template</DialogTitle>
          <DialogDescription>Create a new chat template for {projectName}</DialogDescription>
        </DialogHeader>
        <CreateChatTemplateForm projectId={projectId} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}
