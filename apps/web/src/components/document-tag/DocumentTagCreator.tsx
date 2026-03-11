"use client"

import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@caseai-connect/ui/shad/dialog"
import { PlusIcon } from "lucide-react"
import { useState } from "react"
import type { DocumentTag } from "@/features/document-tags/document-tags.models"
import { createDocumentTag } from "@/features/document-tags/document-tags.thunks"
import { useAppDispatch } from "@/store/hooks"
import { DocumentTagForm } from "./DocumentTagForm"

export function DocumentTagCreator({ allTags }: { allTags: DocumentTag[] }) {
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)

  const handleSubmit = async (data: {
    name: string
    description: string | null
    parentId: string | null
  }) => {
    await dispatch(createDocumentTag({ fields: data })).unwrap()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusIcon />
          Add tag
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create tag</DialogTitle>
        </DialogHeader>
        <DocumentTagForm allTags={allTags} onSubmit={handleSubmit} submitLabel="Create" />
      </DialogContent>
    </Dialog>
  )
}
