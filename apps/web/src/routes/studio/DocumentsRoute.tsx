import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@caseai-connect/ui/shad/collapsible"
import { ChevronRight } from "lucide-react"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { DocumentTagTreeNode } from "@/components/document/DocumentTagTreeNode"
import { EmptyDocument } from "@/components/document/EmptyDocument"
import { UploadDocumentButton } from "@/components/document/UploadDocumentButton"
import { DocumentTagsSheet } from "@/components/document-tag/DocumentTagsSheet"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import type { DocumentTag } from "@/features/document-tags/document-tags.models"
import { buildTagTree } from "@/features/document-tags/document-tags.models"
import { selectDocumentTagsData } from "@/features/document-tags/document-tags.selectors"
import type { Document } from "@/features/documents/documents.models"
import { selectDocumentsData } from "@/features/documents/documents.selectors"
import { useAppSelector } from "@/store/hooks"
import { DocumentItem } from "../../components/document/DocumentItem"
import { AsyncRoute } from "../AsyncRoute"

export function DocumentsRoute() {
  const documents = useAppSelector(selectDocumentsData)
  const documentTags = useAppSelector(selectDocumentTagsData)
  return (
    <AsyncRoute data={[documents, documentTags]}>
      {([documentsValue, documentTagsValue]) => (
        <WithData documents={documentsValue} documentTags={documentTagsValue} />
      )}
    </AsyncRoute>
  )
}

function WithData({
  documents,
  documentTags,
}: {
  documents: Document[]
  documentTags: DocumentTag[]
}) {
  useHandleHeader(documentTags)
  const { t } = useTranslation("documentTag")
  const tagTree = buildTagTree(documentTags)
  const untagged = documents.filter((document) => document.tagIds.length === 0)

  return (
    <div className="p-6 flex flex-col gap-6">
      {documents.length === 0 ? (
        <EmptyDocument />
      ) : (
        <div className="flex flex-col gap-2">
          {tagTree.map((tag) => (
            <DocumentTagTreeNode
              key={tag.id}
              tag={tag}
              documents={documents}
              depth={0}
              documentTags={documentTags}
            />
          ))}
          {untagged.length > 0 && (
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground w-full py-1 [&[data-state=open]>svg]:rotate-90">
                <ChevronRight className="size-4 transition-transform" />
                {t("untagged")}
                <span className="ml-1 text-xs text-muted-foreground">({untagged.length})</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="flex flex-col gap-3 pl-5 pt-2">
                {untagged.map((document) => (
                  <DocumentItem key={document.id} document={document} documentTags={documentTags} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}
    </div>
  )
}

function useHandleHeader(documentTags: DocumentTag[]) {
  const { setHeaderRightSlot } = useSidebarLayout()
  useEffect(() => {
    setHeaderRightSlot(
      <div className="flex items-center gap-2">
        <DocumentTagsSheet documentTags={documentTags} />
        <UploadDocumentButton />
      </div>,
    )
    return () => {
      setHeaderRightSlot(undefined)
    }
  }, [setHeaderRightSlot, documentTags])
}
