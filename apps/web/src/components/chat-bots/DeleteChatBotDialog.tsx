"use client"

import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@caseai-connect/ui/shad/dialog"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import type { ChatBot } from "@/features/chat-bots/chat-bots.models"
import { selectChatBotsStatus } from "@/features/chat-bots/chat-bots.selectors"
import { deleteChatBot, listChatBots } from "@/features/chat-bots/chat-bots.thunks"
import { ADS } from "@/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

interface DeleteChatBotDialogProps {
  chatBot: ChatBot | null
  onClose: () => void
}

export function DeleteChatBotDialog({ chatBot, onClose }: DeleteChatBotDialogProps) {
  const { t } = useTranslation("chatBot", { keyPrefix: "delete" })
  const { t: tCommon } = useTranslation("common")
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectChatBotsStatus)

  if (!chatBot) {
    return null
  }

  const handleDelete = async () => {
    try {
      await dispatch(deleteChatBot({ chatBotId: chatBot.id })).unwrap()
      toast.success(t("success"))
      onClose()
      dispatch(listChatBots({ projectId: chatBot.projectId }))
    } catch (err) {
      const errorMessage = (err as { message?: string })?.message || t("error")
      toast.error(errorMessage)
    }
  }

  return (
    <Dialog open={!!chatBot} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description", { name: chatBot.name })}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={ADS.isLoading(status)}>
            {tCommon("cancel")}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={ADS.isLoading(status)}>
            {ADS.isLoading(status) ? t("submitting") : t("submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
