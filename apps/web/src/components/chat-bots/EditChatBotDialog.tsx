"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@caseai-connect/ui/shad/dialog"
import { useTranslation } from "react-i18next"
import type { ChatBot } from "@/features/chat-bots/chat-bots.models"
import { UpdateChatBotForm } from "./UpdateChatBotForm"

interface EditChatBotDialogProps {
  chatBot: ChatBot | null
  onClose: () => void
}

export function EditChatBotDialog({ chatBot, onClose }: EditChatBotDialogProps) {
  const { t } = useTranslation("chatBot", { keyPrefix: "update" })
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
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <UpdateChatBotForm chatBot={chatBot} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}
