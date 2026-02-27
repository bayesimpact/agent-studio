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
import { ProjectForm } from "@/components/project/ProjectForm"
import type { Organization } from "@/features/organizations/organizations.models"
import { createProject } from "@/features/projects/projects.thunks"
import { useBuildPath } from "@/hooks/use-build-path"
import { useAppDispatch } from "@/store/hooks"

export function ProjectCreator({ organization }: { organization: Organization }) {
  const { buildPath } = useBuildPath()
  const { t } = useTranslation()

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
          <span className="capitalize-first">{t("actions:create")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("project:create.title")}</DialogTitle>
          <DialogDescription>
            {t("project:create.description", { organizationName: organization.name })}
          </DialogDescription>
        </DialogHeader>

        <CreateForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}

function CreateForm({ onSuccess }: { onSuccess: (projectId: string) => void }) {
  const dispatch = useAppDispatch()
  const handleSubmit = async (data: { name: string }) => {
    dispatch(createProject({ payload: { name: data.name }, onSuccess }))
  }
  return <ProjectForm onSubmit={handleSubmit} />
}
