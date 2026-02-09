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
import type { Document } from "@/features/documents/documents.models"
import { selectDocumentsData } from "@/features/documents/documents.selectors"
import { deleteDocument } from "@/features/documents/documents.thunks"
import { ADS } from "@/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

export function DeleteDocumentDialog({
  organizationId,
  document,
}: {
  organizationId: string
  document: Document
}) {
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    setOpen(false)
  }

  const handleClose = () => {
    setOpen(false)
  }

  if (!document) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Trash2Icon />
        </Button>
      </DialogTrigger>
      <Content
        organizationId={organizationId}
        document={document}
        onSuccess={handleSuccess}
        onClose={handleClose}
      />
    </Dialog>
  )
}

function Content({
  organizationId,
  document,
  onSuccess,
  onClose,
}: {
  organizationId: string
  document: Document
  onSuccess: () => void
  onClose: () => void
}) {
  const { t } = useTranslation("documents", { keyPrefix: "delete" })
  const { t: tCommon } = useTranslation("common")
  const dispatch = useAppDispatch()
  const resourcesData = useAppSelector(selectDocumentsData)

  const handleDelete = () => {
    dispatch(
      deleteDocument({
        organizationId,
        projectId: document.projectId,
        documentId: document.id,
        onSuccess,
      }),
    )
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>
        <DialogDescription className="wrap-anywhere">
          {t("description", { name: document.title })}
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
