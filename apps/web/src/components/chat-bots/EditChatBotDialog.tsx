"use client"

import { Button } from "@caseai-connect/ui/shad/button"
import { ScrollArea } from "@caseai-connect/ui/shad/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@caseai-connect/ui/shad/sheet"
import { PenLineIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { ChatBot } from "@/features/chat-bots/chat-bots.models"
import { UpdateChatBotForm } from "./UpdateChatBotForm"

export function EditChatBotDialogWithTrigger({ chatBot }: { chatBot: ChatBot }) {
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    setOpen(false)
  }

  if (!chatBot) return null
  return (
    <Sheet modal open={open} onOpenChange={(open: boolean) => setOpen(open)}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <PenLineIcon />
        </Button>
      </SheetTrigger>

      <Content chatBot={chatBot} onSuccess={handleSuccess} />
    </Sheet>
  )
}

export function EditChatBotDialogWithOutTrigger({
  chatBot,
  onClose,
}: {
  chatBot: ChatBot | null
  onClose: () => void
}) {
  const handleSuccess = () => {
    onClose()
  }

  if (!chatBot) return null
  return (
    <Sheet modal open={!!chatBot} onOpenChange={(open: boolean) => !open && onClose()}>
      <Content chatBot={chatBot} onSuccess={handleSuccess} />
    </Sheet>
  )
}

function Content({ chatBot, onSuccess }: { chatBot: ChatBot; onSuccess: () => void }) {
  const { t } = useTranslation("chatBot", { keyPrefix: "update" })
  return (
    <SheetContent side="bottom" className="h-dvh">
      <ScrollArea className="h-full">
        <SheetHeader>
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>{t("description")}</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          <UpdateChatBotForm chatBot={chatBot} onSuccess={onSuccess} />
        </div>
      </ScrollArea>
    </SheetContent>
  )
}
