import { Item, ItemContent, ItemHeader, ItemTitle } from "@caseai-connect/ui/shad/item"
import { FileIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { MarkdownWrapper } from "@/components/chat/MarkdownWrapper"
import type { Document } from "@/features/documents/documents.models"
import { buildDate } from "@/utils/build-date"
import { DocumentDeletor } from "./DocumentDeletor"
import { OpenDocumentUrl } from "./OpenDocumentUrl"

export function DocumentItem({
  document,
  organizationId,
}: {
  document: Document
  organizationId: string
}) {
  const { t } = useTranslation("document", { keyPrefix: "props" })
  return (
    <Item variant="outline" className="w-full">
      <ItemHeader>
        <ItemTitle>
          <FileIcon />
          <span className="wrap-anywhere">{document.title}</span>
        </ItemTitle>

        <div className="flex gap-2 items-center">
          <OpenDocumentUrl
            organizationId={organizationId}
            projectId={document.projectId}
            document={document}
          />
          <DocumentDeletor organizationId={organizationId} document={document} />
        </div>
      </ItemHeader>

      <ItemContent>
        <div className="flex flex-col gap-2 mb-4 text-muted-foreground">
          <MetaData label={t("createdAt")} value={buildDate(document.createdAt)} />
          <MetaData label={t("updatedAt")} value={buildDate(document.updatedAt)} />
          <MetaData label={t("fileName")} value={document.fileName} />
          <MetaData label={t("size")} value={document.size?.toString()} />
          <MetaData label={t("language")} value={document.language} />
          <MetaData label={t("mimeType")} value={document.mimeType} />
        </div>

        {document.content && <MarkdownWrapper content={document.content} />}
      </ItemContent>
    </Item>
  )
}

function MetaData({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex gap-1">
      <span className="font-medium">{label}:</span>
      <span>{value}</span>
    </div>
  )
}
