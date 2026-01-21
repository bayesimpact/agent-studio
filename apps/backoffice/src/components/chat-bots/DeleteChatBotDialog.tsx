"use client"

import type { ChatBotDto } from "@caseai-connect/api-contracts"
import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@caseai-connect/ui/shad/dialog"
import { toast } from "sonner"
import { selectChatBotsStatus } from "@/features/chat-bots/chat-bots.selectors"
import { deleteChatBot, listChatBots } from "@/features/chat-bots/chat-bots.thunks"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

interface DeleteChatBotDialogProps {
  chatBot: ChatBotDto | null
  projectId: string
  onClose: () => void
}

export function DeleteChatBotDialog({ chatBot, projectId, onClose }: DeleteChatBotDialogProps) {
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectChatBotsStatus)

  if (!chatBot) {
    return null
  }

  const handleDelete = async () => {
    try {
      await dispatch(deleteChatBot(chatBot.id)).unwrap()
      toast.success("Chat template deleted successfully")
      onClose()
      dispatch(listChatBots(projectId))
    } catch (err) {
      const errorMessage =
        (err as { message?: string })?.message || "Failed to delete chat template"
      toast.error(errorMessage)
    }
  }

  return (
    <Dialog open={!!chatBot} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Chat Template</DialogTitle>
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
