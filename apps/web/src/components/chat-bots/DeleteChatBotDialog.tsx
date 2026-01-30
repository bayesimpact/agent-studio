"use client"

import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@caseai-connect/ui/shad/dialog"
import { Trash2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { ChatBot } from "@/features/chat-bots/chat-bots.models"
import { selectChatBotsStatus } from "@/features/chat-bots/chat-bots.selectors"
import { deleteChatBot } from "@/features/chat-bots/chat-bots.thunks"
import { ADS } from "@/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

interface DeleteChatBotDialogProps {
  chatBot: ChatBot | null
  onClose?: () => void
  withTrigger?: boolean
}

export function DeleteChatBotDialog({
  chatBot,
  onClose,
  withTrigger = true,
}: DeleteChatBotDialogProps) {
  const { t } = useTranslation("chatBot", { keyPrefix: "delete" })
  const { t: tCommon } = useTranslation("common")
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectChatBotsStatus)

  if (!chatBot) {
    return null
  }

  const handleDelete = () => {
    dispatch(deleteChatBot({ projectId: chatBot.projectId, chatBotId: chatBot.id }))
    onClose?.()
  }

  return (
    <Dialog
      open={withTrigger ? undefined : !!chatBot}
      onOpenChange={(open: boolean) => !open && onClose?.()}
    >
      {withTrigger && (
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Trash2Icon />
          </Button>
        </DialogTrigger>
      )}

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
