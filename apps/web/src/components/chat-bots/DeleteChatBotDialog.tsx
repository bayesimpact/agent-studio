"use client"

import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@caseai-connect/ui/shad/dialog"
import { toast } from "sonner"
import type { ChatBot } from "@/features/chat-bots/chat-bots.models"
import { selectChatBotsStatus } from "@/features/chat-bots/chat-bots.selectors"
import { deleteChatBot, listChatBots } from "@/features/chat-bots/chat-bots.thunks"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

interface DeleteChatBotDialogProps {
  chatBot: ChatBot | null
  onClose: () => void
}

export function DeleteChatBotDialog({ chatBot, onClose }: DeleteChatBotDialogProps) {
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectChatBotsStatus)

  if (!chatBot) {
    return null
  }

  const handleDelete = async () => {
    try {
      await dispatch(deleteChatBot(chatBot.id)).unwrap()
      toast.success("ChatBot deleted successfully")
      onClose()
      dispatch(listChatBots(chatBot.projectId))
    } catch (err) {
      const errorMessage = (err as { message?: string })?.message || "Failed to delete chat bot"
      toast.error(errorMessage)
    }
  }

  return (
    <Dialog open={!!chatBot} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete ChatBot</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{chatBot.name}"? This action cannot be undone.
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
