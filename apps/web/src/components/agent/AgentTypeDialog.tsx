"use client"

import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@caseai-connect/ui/shad/dialog"
import { cn } from "@caseai-connect/ui/utils"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { Agent } from "@/features/agents/agents.models"

export function AgentTypeDialog({
  open,
  onOpenChange,
  onSelectType,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectType: (type: Agent["type"]) => void
}) {
  const { t } = useTranslation("agent", { keyPrefix: "typeDialog" })
  const [selectedType, setSelectedType] = useState<Agent["type"]>("conversation")

  const handleConfirm = () => {
    onSelectType(selectedType)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setSelectedType("conversation")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("label")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={cn(
                "border rounded-md px-3 py-2 text-sm text-left",
                selectedType === "conversation" ? "border-primary" : "border-muted",
              )}
              onClick={() => setSelectedType("conversation")}
            >
              {t("conversation")}
            </button>
            <button
              type="button"
              className={cn(
                "border rounded-md px-3 py-2 text-sm text-left",
                selectedType === "extraction" ? "border-primary" : "border-muted",
              )}
              onClick={() => setSelectedType("extraction")}
            >
              {t("extraction")}
            </button>
          </div>
          <Button type="button" onClick={handleConfirm} className="w-full">
            {t("confirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
