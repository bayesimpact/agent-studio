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
import { Trash2Icon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { Resource } from "@/features/resources/resources.models"
import { selectResourcesData } from "@/features/resources/resources.selectors"
import { deleteResource } from "@/features/resources/resources.thunks"
import { ADS } from "@/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

export function DeleteResourceDialog({
  organizationId,
  resource,
}: {
  organizationId: string
  resource: Resource
}) {
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    setOpen(false)
  }

  const handleClose = () => {
    setOpen(false)
  }

  if (!resource) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Trash2Icon />
        </Button>
      </DialogTrigger>
      <Content
        organizationId={organizationId}
        resource={resource}
        onSuccess={handleSuccess}
        onClose={handleClose}
      />
    </Dialog>
  )
}

function Content({
  organizationId,
  resource,
  onSuccess,
  onClose,
}: {
  organizationId: string
  resource: Resource
  onSuccess: () => void
  onClose: () => void
}) {
  const { t } = useTranslation("resources", { keyPrefix: "delete" })
  const { t: tCommon } = useTranslation("common")
  const dispatch = useAppDispatch()
  const resourcesData = useAppSelector(selectResourcesData)

  const handleDelete = () => {
    dispatch(
      deleteResource({
        organizationId,
        projectId: resource.projectId,
        resourceId: resource.id,
        onSuccess,
      }),
    )
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>
        <DialogDescription className="wrap-anywhere">
          {t("description", { name: resource.title })}
        </DialogDescription>
      </DialogHeader>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onClose} disabled={ADS.isLoading(resourcesData)}>
          {tCommon("cancel")}
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={ADS.isLoading(resourcesData)}
        >
          {ADS.isLoading(resourcesData) ? t("submitting") : t("submit")}
        </Button>
      </div>
    </DialogContent>
  )
}
