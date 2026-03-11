"use client"

import { Badge } from "@caseai-connect/ui/shad/badge"
import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@caseai-connect/ui/shad/dialog"
import { Field, FieldGroup, FieldLabel, FieldSet } from "@caseai-connect/ui/shad/field"
import { Input } from "@caseai-connect/ui/shad/input"
import { PencilIcon, XIcon } from "lucide-react"
import { useReducer, useState } from "react"
import type { DocumentTag } from "@/features/document-tags/document-tags.models"
import { selectDocumentTagsData } from "@/features/document-tags/document-tags.selectors"
import type { Document } from "@/features/documents/documents.models"
import { updateDocument } from "@/features/documents/documents.thunks"
import { ADS } from "@/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { DocumentTagPicker } from "./DocumentTagPicker"

type EditorAction =
  | { type: "SET_TITLE"; title: string }
  | { type: "ADD_TAG"; tagId: string }
  | { type: "REMOVE_TAG"; tagId: string }

type EditorState = { title: string; tagIds: string[] }

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "SET_TITLE":
      return { ...state, title: action.title }
    case "ADD_TAG":
      return { ...state, tagIds: [...state.tagIds, action.tagId] }
    case "REMOVE_TAG":
      return { ...state, tagIds: state.tagIds.filter((id) => id !== action.tagId) }
  }
}

export function DocumentEditorDialog({ document }: { document: Document }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <PencilIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit document</DialogTitle>
        </DialogHeader>
        {open && <EditorForm document={document} onSuccess={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function EditorForm({ document, onSuccess }: { document: Document; onSuccess: () => void }) {
  const dispatch = useAppDispatch()
  const documentTagsData = useAppSelector(selectDocumentTagsData)
  const allTags: DocumentTag[] = ADS.isFulfilled(documentTagsData) ? documentTagsData.value : []

  const [editorState, dispatchEditor] = useReducer(editorReducer, {
    title: document.title,
    tagIds: document.tags.map((tag) => tag.id),
  })

  const tagNameById = new Map<string, string>([
    ...allTags.map((tag): [string, string] => [tag.id, tag.name]),
    ...document.tags.map((tag): [string, string] => [tag.id, tag.name]),
  ])

  const handleSave = async () => {
    const originalTagIds = document.tags.map((tag) => tag.id)
    const tagsToAdd = editorState.tagIds.filter((id) => !originalTagIds.includes(id))
    const tagsToRemove = originalTagIds.filter((id) => !editorState.tagIds.includes(id))
    await dispatch(
      updateDocument({
        documentId: document.id,
        fields: { title: editorState.title, tagsToAdd, tagsToRemove },
      }),
    ).unwrap()
    onSuccess()
  }

  return (
    <div className="flex flex-col gap-4">
      <FieldGroup>
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="doc-title">Title</FieldLabel>
              <Input
                id="doc-title"
                value={editorState.title}
                onChange={(e) => dispatchEditor({ type: "SET_TITLE", title: e.target.value })}
              />
            </Field>
          </FieldGroup>
        </FieldSet>
      </FieldGroup>

      <div className="flex flex-col gap-2">
        <FieldLabel>Tags</FieldLabel>
        <div className="flex flex-wrap gap-2 items-center">
          {editorState.tagIds.map((id) => (
            <Badge key={id} variant="secondary" className="gap-1">
              {tagNameById.get(id) ?? id}
              <button
                type="button"
                onClick={() => dispatchEditor({ type: "REMOVE_TAG", tagId: id })}
                className="opacity-60 hover:opacity-100"
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
          <DocumentTagPicker
            allTags={allTags}
            attachedTagIds={editorState.tagIds}
            onAdd={(tagId) => dispatchEditor({ type: "ADD_TAG", tagId })}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  )
}
