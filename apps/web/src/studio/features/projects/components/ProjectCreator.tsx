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
import { useAppDispatch } from "@/common/store/hooks"
import type { Organization } from "@/features/organizations/organizations.models"
import { createProject } from "@/features/projects/projects.thunks"
import { useBuildPath } from "@/hooks/use-build-path"
import { GridItem } from "@/studio/components/grid/Grid"
import { ProjectForm } from "@/studio/features/projects/components/ProjectForm"

export function ProjectCreatorButton({
  organization,
  index,
}: {
  index: number
  organization: Organization
}) {
  const { t } = useTranslation()
  return (
    <GridItem
      index={index}
      className="bg-muted/35"
      title={t("project:create.title")}
      description={t("project:create.description", { organizationName: organization.name })}
      action={<ProjectCreator organization={organization} />}
    />
  )
}

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
  const { buildPath } = useBuildPath()
  const { t } = useTranslation()

  const [open, setOpen] = useState(false)

  const handleSuccess = (projectId: string) => {
    modalHandler ? modalHandler.setOpen(false) : setOpen(false)

    const path = buildPath("project", { organizationId: organization.id, projectId })
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
