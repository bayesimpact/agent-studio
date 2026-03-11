import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@caseai-connect/ui/shad/collapsible"
import { ChevronRight } from "lucide-react"
import type { TagNode } from "@/features/document-tags/document-tags.models"
import type { Document } from "@/features/documents/documents.models"
import { DocumentItem } from "./DocumentItem"

export function DocumentTagTreeNode({
  tag,
  documents,
  depth,
}: {
  tag: TagNode
  documents: Document[]
  depth: number
}) {
  const tagDocuments = documents.filter((document) =>
    document.tags.some((documentTag) => documentTag.id === tag.id),
  )
  const hasContent = tagDocuments.length > 0 || tag.children.length > 0

  if (!hasContent) return null

  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger
        className="flex items-center gap-1 text-sm font-medium hover:text-foreground w-full py-1 [&[data-state=open]>svg]:rotate-90"
        style={{ paddingLeft: `${depth * 1.25}rem` }}
      >
        <ChevronRight className="size-4 transition-transform" />
        {tag.name}
        {tagDocuments.length > 0 && (
          <span className="ml-1 text-xs text-muted-foreground">({tagDocuments.length})</span>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent
        className="flex flex-col gap-3 pt-2"
        style={{ paddingLeft: `${(depth + 1) * 1.25}rem` }}
      >
        {tagDocuments.map((document) => (
          <DocumentItem key={document.id} document={document} />
        ))}
        {tag.children.map((child) => (
          <DocumentTagTreeNode key={child.id} tag={child} documents={documents} depth={depth + 1} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}
