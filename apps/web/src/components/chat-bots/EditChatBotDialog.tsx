"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@caseai-connect/ui/shad/dialog"
import type { ChatBot } from "@/features/chat-bots/chat-bots.models"
import { UpdateChatBotForm } from "./UpdateChatBotForm"

interface EditChatBotDialogProps {
  chatBot: ChatBot | null
  onClose: () => void
}

export function EditChatBotDialog({ chatBot, onClose }: EditChatBotDialogProps) {
  if (!chatBot) {
    return null
  }

  const handleSuccess = () => {
    onClose()
  }

  return (
    <Dialog open={!!chatBot} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit ChatBot</DialogTitle>
          <DialogDescription>Update the chat bot details</DialogDescription>
        </DialogHeader>
        <UpdateChatBotForm chatBot={chatBot} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}
