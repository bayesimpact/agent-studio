"use client"

import type { ProjectDto } from "@caseai-connect/api-contracts"
import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@caseai-connect/ui/shad/dialog"
import { PenLineIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { Project } from "@/features/projects/projects.models"
import { updateProject } from "@/features/projects/projects.thunks"
import { useAppDispatch } from "@/store/hooks"
import { ProjectForm } from "./ProjectForm"

export function ProjectEditor({ project }: { project: Project }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState<boolean>(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PenLineIcon />
          <span className="capitalize-first">{t("edit")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("project:update.title")}</DialogTitle>
          <DialogDescription>{t("project:update.description")}</DialogDescription>
        </DialogHeader>

        <UpdateForm project={project} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

function UpdateForm({ project, onSuccess }: { project: ProjectDto; onSuccess?: () => void }) {
  const dispatch = useAppDispatch()
  const handleSubmit = async (data: { name: string }) => {
    dispatch(updateProject({ payload: { name: data.name } }))
    onSuccess?.()
  }
  return <ProjectForm editableProject={project} onSubmit={handleSubmit} />
}
