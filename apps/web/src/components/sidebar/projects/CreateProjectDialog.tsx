"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@caseai-connect/ui/shad/dialog"
import { SidebarMenuButton } from "@caseai-connect/ui/shad/sidebar"
import { PlusIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { CreateProjectForm } from "@/components/projects/CreateProjectForm"
import type { Organization } from "@/features/organizations/organizations.models"
import { useBuildPath } from "@/hooks/use-build-path"

export function CreateProjectDialogWithTrigger({ organization }: { organization: Organization }) {
  const navigate = useNavigate()
  const { buildPath } = useBuildPath()
  const { t } = useTranslation("project", { keyPrefix: "createButton" })

  const [open, setOpen] = useState(false)

  const handleSuccess = (projectId: string) => {
    setOpen(false)
    const path = buildPath("project", { projectId })
    navigate(path)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <SidebarMenuButton tooltip={t("title")}>
          <PlusIcon />
          <span>{t("title")}</span>
        </SidebarMenuButton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { organizationName: organization.name })}
          </DialogDescription>
        </DialogHeader>
        <CreateProjectForm organizationId={organization.id} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}
