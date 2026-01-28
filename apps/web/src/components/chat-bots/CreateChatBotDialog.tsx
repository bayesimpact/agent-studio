"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@caseai-connect/ui/shad/dialog"
import { CreateChatBotForm } from "./CreateChatBotForm"

interface CreateChatBotDialogProps {
  projectId: string
  projectName: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateChatBotDialog({
  projectId,
  projectName,
  isOpen,
  onOpenChange,
}: CreateChatBotDialogProps) {
  const handleSuccess = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create ChatBot</DialogTitle>
          <DialogDescription>Create a new chat bot for {projectName}</DialogDescription>
        </DialogHeader>
        <CreateChatBotForm projectId={projectId} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}
