import { Item, ItemHeader, ItemTitle } from "@caseai-connect/ui/shad/item"
import { FileIcon } from "lucide-react"
import type { Document } from "@/features/documents/documents.models"
import { DocumentDeletor } from "./DocumentDeletor"
import { DocumentDetailsSheet } from "./DocumentDetailsSheet"
import { DocumentEditorDialog } from "./DocumentEditorDialog"
import { DocumentOpener } from "./DocumentOpener"

export function DocumentItem({ document }: { document: Document }) {
  return (
    <Item variant="outline" className="w-full">
      <ItemHeader>
        <ItemTitle>
          <FileIcon />
          <span className="wrap-anywhere">{document.title}</span>
        </ItemTitle>

        <div className="flex gap-2 items-center">
          <DocumentOpener noText documentId={document.id} />
          <DocumentDetailsSheet document={document} />
          <DocumentEditorDialog document={document} />
          <DocumentDeletor document={document} />
        </div>
      </ItemHeader>
    </Item>
  )
}
