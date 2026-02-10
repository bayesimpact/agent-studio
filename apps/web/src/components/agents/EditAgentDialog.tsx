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
import type { Agent } from "@/features/agents/agents.models"
import { UpdateAgentForm } from "./UpdateAgentForm"

export function EditAgentDialogWithTrigger({
  organizationId,
  agent,
}: {
  organizationId: string
  agent: Agent
}) {
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    setOpen(false)
  }

  if (!agent) return null
  return (
    <Sheet modal open={open} onOpenChange={(open: boolean) => setOpen(open)}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <PenLineIcon />
        </Button>
      </SheetTrigger>

      <Content organizationId={organizationId} agent={agent} onSuccess={handleSuccess} />
    </Sheet>
  )
}

export function EditAgentDialogWithOutTrigger({
  organizationId,
  agent,
  onClose,
}: {
  organizationId: string
  agent: Agent | null
  onClose: () => void
}) {
  const handleSuccess = () => {
    onClose()
  }

  if (!agent) return null
  return (
    <Sheet modal open={!!agent} onOpenChange={(open: boolean) => !open && onClose()}>
      <Content organizationId={organizationId} agent={agent} onSuccess={handleSuccess} />
    </Sheet>
  )
}

function Content({
  organizationId,
  agent,
  onSuccess,
}: {
  organizationId: string
  agent: Agent
  onSuccess: () => void
}) {
  const { t } = useTranslation("agent", { keyPrefix: "update" })
  return (
    <SheetContent side="bottom" className="h-dvh">
      <ScrollArea className="h-full">
        <SheetHeader>
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>{t("description")}</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          <UpdateAgentForm organizationId={organizationId} agent={agent} onSuccess={onSuccess} />
        </div>
      </ScrollArea>
    </SheetContent>
  )
}
