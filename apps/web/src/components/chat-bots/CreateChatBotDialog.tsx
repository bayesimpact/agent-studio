"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@caseai-connect/ui/shad/dialog"
import { useTranslation } from "react-i18next"
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
  const { t } = useTranslation("chatBot", { keyPrefix: "create" })
  const handleSuccess = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description", { projectName })}</DialogDescription>
        </DialogHeader>
        <CreateChatBotForm projectId={projectId} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}
