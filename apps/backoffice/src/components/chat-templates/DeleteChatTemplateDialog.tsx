"use client"

import type { ChatTemplateDto } from "@caseai-connect/api-contracts"
import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@caseai-connect/ui/shad/dialog"
import { toast } from "sonner"
import { selectChatTemplatesStatus } from "@/features/chat-templates/chat-templates.selectors"
import {
  deleteChatTemplate,
  listChatTemplates,
} from "@/features/chat-templates/chat-templates.thunks"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

interface DeleteChatTemplateDialogProps {
  chatTemplate: ChatTemplateDto | null
  projectId: string
  onClose: () => void
}

export function DeleteChatTemplateDialog({
  chatTemplate,
  projectId,
  onClose,
}: DeleteChatTemplateDialogProps) {
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectChatTemplatesStatus)

  if (!chatTemplate) {
    return null
  }

  const handleDelete = async () => {
    try {
      await dispatch(deleteChatTemplate(chatTemplate.id)).unwrap()
      toast.success("Chat template deleted successfully")
      onClose()
      dispatch(listChatTemplates(projectId))
    } catch (err) {
      const errorMessage =
        (err as { message?: string })?.message || "Failed to delete chat template"
      toast.error(errorMessage)
    }
  }

  return (
    <Dialog open={!!chatTemplate} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Chat Template</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{chatTemplate.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={status === "loading"}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={status === "loading"}>
            {status === "loading" ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
