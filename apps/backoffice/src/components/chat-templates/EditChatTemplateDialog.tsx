"use client"

import type { ChatTemplateDto } from "@caseai-connect/api-contracts"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@caseai-connect/ui/shad/dialog"
import { listChatTemplates } from "@/features/chat-templates/chat-templates.thunks"
import { useAppDispatch } from "@/store/hooks"
import { UpdateChatTemplateForm } from "./UpdateChatTemplateForm"

interface EditChatTemplateDialogProps {
  chatTemplate: ChatTemplateDto | null
  projectId: string
  onClose: () => void
}

export function EditChatTemplateDialog({
  chatTemplate,
  projectId,
  onClose,
}: EditChatTemplateDialogProps) {
  const dispatch = useAppDispatch()

  if (!chatTemplate) {
    return null
  }

  const handleSuccess = () => {
    onClose()
    dispatch(listChatTemplates(projectId))
  }

  return (
    <Dialog open={!!chatTemplate} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Chat Template</DialogTitle>
          <DialogDescription>Update the chat template details</DialogDescription>
        </DialogHeader>
        <UpdateChatTemplateForm chatTemplate={chatTemplate} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}
