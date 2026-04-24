"use client"

import { allowedDocumentUploadMimeTypesForFileUploader } from "@caseai-connect/api-contracts"
import { Badge } from "@caseai-connect/ui/shad/badge"
import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@caseai-connect/ui/shad/dialog"
import { FieldLabel } from "@caseai-connect/ui/shad/field"
import { XIcon } from "lucide-react"
import { useReducer } from "react"
import { useTranslation } from "react-i18next"
import { FileUploader } from "@/common/components/FileUploader"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import {
  getTagNameById,
  useDocumentTags,
} from "@/studio/features/document-tags/document-tags.helpers"
import { selectUploaderState } from "@/studio/features/documents/documents.selectors"
import { uploadDocuments } from "@/studio/features/documents/documents.thunks"
import { DocumentTagPicker } from "./DocumentTagPicker"

type UploadDialogAction =
  | { type: "OPEN"; files: File[] }
  | { type: "CLOSE" }
  | { type: "ADD_TAG"; tagId: string }
  | { type: "REMOVE_TAG"; tagId: string }

// Keep this state local to the component:
// - it contains browser File objects (non-serializable for Redux state),
// - it is ephemeral pre-submit dialog state (open/close + temporary tag picks),
// - only this component needs it before dispatching uploadDocuments.
type UploadDialogState = { status: "closed" } | { status: "open"; files: File[]; tagIds: string[] }

function uploadDialogReducer(
  state: UploadDialogState,
  action: UploadDialogAction,
): UploadDialogState {
  switch (action.type) {
    case "OPEN":
      return { status: "open", files: action.files, tagIds: [] }
    case "CLOSE":
      return { status: "closed" }
    case "ADD_TAG": {
      if (state.status !== "open") {
        return state
      }
      if (state.tagIds.includes(action.tagId)) {
        return state
      }
      return { ...state, tagIds: [...state.tagIds, action.tagId] }
    }
    case "REMOVE_TAG": {
      if (state.status !== "open") {
        return state
      }
      return { ...state, tagIds: state.tagIds.filter((id) => id !== action.tagId) }
    }
  }
}

export function UploadDocumentsButton() {
  const dispatch = useAppDispatch()
  const uploaderState = useAppSelector(selectUploaderState)
  const { documentTags } = useDocumentTags()
  const { t } = useTranslation()
  const [dialog, dispatchDialog] = useReducer(uploadDialogReducer, {
    status: "closed",
  } satisfies UploadDialogState)

  const isDialogOpen = dialog.status === "open"
  const dialogFiles = dialog.status === "open" ? dialog.files : []
  const dialogTagIds = dialog.status === "open" ? dialog.tagIds : []
  const hasAvailableTags = documentTags.length > 0
  const handleDropFiles = async (files: File[]) => {
    if (hasAvailableTags) {
      dispatchDialog({ type: "OPEN", files })
      return
    }

    try {
      await dispatch(
        uploadDocuments({
          files,
          sourceType: "project",
        }),
      ).unwrap()
    } catch {
      // Errors are surfaced via notifications middleware.
    }
  }
  const handleConfirmUpload = async () => {
    if (dialog.status !== "open") {
      return
    }
    try {
      await dispatch(
        uploadDocuments({
          files: dialog.files,
          sourceType: "project",
          tagIds: dialog.tagIds.length > 0 ? dialog.tagIds : undefined,
        }),
      ).unwrap()
      dispatchDialog({ type: "CLOSE" })
    } catch {
      // Errors are surfaced via notifications middleware.
    }
  }

  return (
    <>
      <FileUploader
        allowedMimeTypes={allowedDocumentUploadMimeTypesForFileUploader}
        maxFiles={400}
        disabled={uploaderState.status === "uploading"}
        maxSize={40 * 1024 * 1024} // 40MB
        onDropFiles={handleDropFiles}
      />
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            dispatchDialog({ type: "CLOSE" })
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("document:upload.tagDialog.title")}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            {t("document:upload.tagDialog.description")}
          </p>
          <p className="text-foreground text-sm font-medium">
            {t("document:upload.tagDialog.fileCountSentence", { count: dialogFiles.length })}
          </p>
          <div className="flex flex-col gap-2">
            <FieldLabel>{t("document:props.tags")}</FieldLabel>
            <div className="flex flex-wrap items-center gap-2">
              {dialogTagIds.map((tagId) => (
                <Badge key={tagId} variant="secondary" className="gap-1">
                  {getTagNameById(documentTags, tagId)}
                  <button
                    type="button"
                    onClick={() => dispatchDialog({ type: "REMOVE_TAG", tagId })}
                    className="opacity-60 hover:opacity-100"
                  >
                    <XIcon className="size-3" />
                  </button>
                </Badge>
              ))}
              <DocumentTagPicker
                documentTags={documentTags}
                attachedTagIds={dialogTagIds}
                onAdd={(tagId) => dispatchDialog({ type: "ADD_TAG", tagId })}
              />
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => dispatchDialog({ type: "CLOSE" })}
              disabled={uploaderState.status === "uploading"}
            >
              {t("actions:cancel")}
            </Button>
            <Button
              type="button"
              disabled={uploaderState.status === "uploading"}
              onClick={handleConfirmUpload}
            >
              {t("document:upload.tagDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
