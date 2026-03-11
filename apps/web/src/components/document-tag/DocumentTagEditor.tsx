"use client"

import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@caseai-connect/ui/shad/dialog"
import { PencilIcon } from "lucide-react"
import { useState } from "react"
import type { DocumentTag } from "@/features/document-tags/document-tags.models"
import { updateDocumentTag } from "@/features/document-tags/document-tags.thunks"
import { useAppDispatch } from "@/store/hooks"
import { DocumentTagForm } from "./DocumentTagForm"

export function DocumentTagEditor({ allTags, tag }: { allTags: DocumentTag[]; tag: DocumentTag }) {
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)

  const handleSubmit = async (data: {
    name: string
    description: string | null
    parentId: string | null
  }) => {
    await dispatch(updateDocumentTag({ documentTagId: tag.id, fields: data })).unwrap()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <PencilIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit tag</DialogTitle>
        </DialogHeader>
        <DocumentTagForm
          allTags={allTags}
          excludeTagId={tag.id}
          defaultName={tag.name}
          defaultDescription={tag.description ?? ""}
          defaultParentId={tag.parentId}
          onSubmit={handleSubmit}
          submitLabel="Save"
        />
      </DialogContent>
    </Dialog>
  )
}
