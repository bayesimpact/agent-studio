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
import type { DocumentTag } from "@/features/document-tags/document-tags.models"
import { deleteDocumentTag } from "@/features/document-tags/document-tags.thunks"
import { useAppDispatch } from "@/store/hooks"

export function DocumentTagDeletor({ tag }: { tag: DocumentTag }) {
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)

  const handleDelete = () => {
    dispatch(deleteDocumentTag({ documentTagId: tag.id, onSuccess: () => setOpen(false) }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Trash2Icon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{tag.name}&rdquo;?</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
