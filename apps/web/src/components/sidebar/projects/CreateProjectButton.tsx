"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@caseai-connect/ui/shad/dialog"
import { SidebarMenuButton, SidebarMenuItem } from "@caseai-connect/ui/shad/sidebar"
import { PlusIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { CreateProjectForm } from "@/components/projects/CreateProjectForm"

interface CreateProjectButtonProps {
  organizationId: string
  organizationName: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProjectButton({
  organizationId,
  organizationName,
  isOpen,
  onOpenChange,
}: CreateProjectButtonProps) {
  const handleSuccess = () => {
    onOpenChange(false)
  }
  const { t } = useTranslation("project", { keyPrefix: "createButton" })
  return (
    <SidebarMenuItem>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <SidebarMenuButton tooltip={t("title")}>
            <PlusIcon />
            <span>{t("title")}</span>
          </SidebarMenuButton>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description", { organizationName })}</DialogDescription>
          </DialogHeader>
          <CreateProjectForm organizationId={organizationId} onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>
    </SidebarMenuItem>
  )
}
