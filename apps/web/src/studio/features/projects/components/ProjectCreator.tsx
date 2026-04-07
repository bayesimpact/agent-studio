import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@caseai-connect/ui/shad/dialog"
import { PlusCircleIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { Organization } from "@/features/organizations/organizations.models"
import { createProject } from "@/features/projects/projects.thunks"
import { useAppDispatch } from "@/store/hooks"
import { ProjectForm } from "@/studio/features/projects/components/ProjectForm"
import { useBuildStudioPath } from "@/studio/hooks/use-studio-build-path"

export function ProjectCreator({
  organization,
  modalHandler,
}: {
  organization: Organization
  modalHandler?: {
    open: boolean
    setOpen: (open: boolean) => void
  }
}) {
  const { buildStudioPath } = useBuildStudioPath()
  const { t } = useTranslation()

  const [open, setOpen] = useState(false)

  const handleSuccess = (projectId: string) => {
    modalHandler ? modalHandler.setOpen(false) : setOpen(false)

    const path = buildStudioPath("project", { organizationId: organization.id, projectId })
    window.location.href = path
  }

  return (
    <Dialog
      open={modalHandler ? modalHandler.open : open}
      onOpenChange={modalHandler ? modalHandler.setOpen : setOpen}
    >
      {!modalHandler && (
        <DialogTrigger asChild>
          <Button size="lg" className="text-base">
            {t("actions:create")}
            <PlusCircleIcon className="ml-2 size-5" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("project:create.dialog.title")}</DialogTitle>
          <DialogDescription>
            {t("project:create.dialog.description", { organizationName: organization.name })}
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
