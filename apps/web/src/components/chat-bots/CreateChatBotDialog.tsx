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
    <Sheet modal open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[100dvh]">
        <ScrollArea className="h-full">
          <SheetHeader>
            <SheetTitle>{t("title")}</SheetTitle>
            <SheetDescription>{t("description", { projectName })}</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            <CreateChatBotForm projectId={projectId} onSuccess={handleSuccess} />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
