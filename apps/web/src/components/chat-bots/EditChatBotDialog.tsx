"use client"

import { ScrollArea } from "@caseai-connect/ui/shad/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@caseai-connect/ui/shad/sheet"
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
    <Sheet modal open={!!chatBot} onOpenChange={(open: boolean) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[100dvh]">
        <ScrollArea className="h-full">
          <SheetHeader>
            <SheetTitle>{t("title")}</SheetTitle>
            <SheetDescription>{t("description")}</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            <UpdateChatBotForm chatBot={chatBot} onSuccess={handleSuccess} />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
