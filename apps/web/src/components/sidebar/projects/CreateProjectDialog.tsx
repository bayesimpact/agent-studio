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
import { PlusIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { CreateProjectForm } from "@/components/projects/CreateProjectForm"
import type { Organization } from "@/features/organizations/organizations.models"
import { useBuildPath } from "@/hooks/use-build-path"

export function CreateProjectDialogWithTrigger({ organization }: { organization: Organization }) {
  const { buildPath } = useBuildPath()
  const { t } = useTranslation("project", { keyPrefix: "createButton" })

  const [open, setOpen] = useState(false)

  const handleSuccess = (projectId: string) => {
    setOpen(false)
    const path = buildPath("project", { organizationId: organization.id, projectId })
    window.location.href = path
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon />
          <span>{t("title")}</span>
        </Button>
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
