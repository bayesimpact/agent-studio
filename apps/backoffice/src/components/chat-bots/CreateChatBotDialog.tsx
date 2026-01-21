"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@caseai-connect/ui/shad/dialog"
import { listChatBots } from "@/features/chat-bots/chat-bots.thunks"
import { useAppDispatch } from "@/store/hooks"
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
  const dispatch = useAppDispatch()

  const handleSuccess = () => {
    onOpenChange(false)
    dispatch(listChatBots(projectId))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Chat Template</DialogTitle>
          <DialogDescription>Create a new chat template for {projectName}</DialogDescription>
        </DialogHeader>
        <CreateChatBotForm projectId={projectId} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}
