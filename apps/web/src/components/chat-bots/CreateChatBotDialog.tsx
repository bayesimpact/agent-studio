"use client"

import { ScrollArea } from "@caseai-connect/ui/shad/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@caseai-connect/ui/shad/sheet"
import { SidebarMenuButton } from "@caseai-connect/ui/shad/sidebar"
import { PlusIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import type { Project } from "@/features/projects/projects.models"
import { useBuildPath } from "@/hooks/use-build-path"
import { CreateChatBotForm } from "./CreateChatBotForm"

interface CreateChatBotDialogProps {
  projectId: string
  projectName: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateChatBotDialogWithTrigger({ project }: { project: Project }) {
  const navigate = useNavigate()
  const { buildPath } = useBuildPath()
  const { t } = useTranslation("chatBot", { keyPrefix: "create" })
  const [open, setOpen] = useState(false)
  const handleSuccess = (chatBotId: string) => {
    setOpen(false)
    const path = buildPath("chatBot", { chatBotId })
    navigate(path)
  }
  return (
    <div>
      <Sheet modal open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <SidebarMenuButton>
            <PlusIcon />
            <span>{t("title")}</span>
          </SidebarMenuButton>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-dvh">
          <ScrollArea className="h-full">
            <SheetHeader>
              <SheetTitle>{t("title")}</SheetTitle>
              <SheetDescription>{t("description", { projectName: project.name })}</SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-4">
              <CreateChatBotForm projectId={project.id} onSuccess={handleSuccess} />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export function CreateChatBotDialogWithoutTrigger({
  projectId,
  projectName,
  isOpen,
  onOpenChange,
}: CreateChatBotDialogProps) {
  const { t } = useTranslation("chatBot", { keyPrefix: "create" })
  const navigate = useNavigate()
  const { buildPath } = useBuildPath()
  const handleSuccess = (chatBotId: string) => {
    onOpenChange(false)
    const path = buildPath("chatBot", { chatBotId })
    navigate(path)
  }

  return (
    <Sheet modal open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-dvh">
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
