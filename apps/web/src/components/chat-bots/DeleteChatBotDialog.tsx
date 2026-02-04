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
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import type { ChatBot } from "@/features/chat-bots/chat-bots.models"
import { selectChatBotsStatus } from "@/features/chat-bots/chat-bots.selectors"
import { deleteChatBot } from "@/features/chat-bots/chat-bots.thunks"
import { useBuildPath } from "@/hooks/use-build-path"
import { ADS } from "@/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

export function DeleteChatBotDialogWithTrigger({
  organizationId,
  chatBot,
}: {
  organizationId: string
  chatBot: ChatBot
}) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const { buildPath } = useBuildPath()
  const path = buildPath("project", { organizationId, projectId: chatBot.projectId })

  const handleSuccess = () => {
    navigate(path, { replace: true })
    setOpen(false)
  }

  const handleClose = () => {
    setOpen(false)
  }

  if (!chatBot) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Trash2Icon />
        </Button>
      </DialogTrigger>
      <Content chatBot={chatBot} onSuccess={handleSuccess} onClose={handleClose} />
    </Dialog>
  )
}

export function DeleteChatBotDialogWithOutTrigger({
  organizationId,
  projectId,
  chatBot,
  onClose,
}: {
  organizationId: string
  projectId: string
  chatBot: ChatBot | null
  onClose: () => void
}) {
  const navigate = useNavigate()
  const { buildPath } = useBuildPath()
  const path = buildPath("project", { organizationId, projectId })
  const handleSuccess = () => {
    navigate(path, { replace: true })
    onClose()
  }

  if (!chatBot) return null

  return (
    <Dialog open={!!chatBot} onOpenChange={(open: boolean) => !open && onClose()}>
      <Content chatBot={chatBot} onSuccess={handleSuccess} onClose={onClose} />
    </Dialog>
  )
}

function Content({
  chatBot,
  onSuccess,
  onClose,
}: {
  chatBot: ChatBot
  onSuccess: () => void
  onClose: () => void
}) {
  const { t } = useTranslation("chatBot", { keyPrefix: "delete" })
  const { t: tCommon } = useTranslation("common")
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectChatBotsStatus)

  const handleDelete = () => {
    dispatch(deleteChatBot({ projectId: chatBot.projectId, chatBotId: chatBot.id, onSuccess }))
  }

  return (
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
  )
}
