import { Item, ItemContent, ItemHeader, ItemTitle } from "@caseai-connect/ui/shad/item"
import { format } from "date-fns"
import { FileIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { MarkdownWrapper } from "@/components/chat/MarkdownWrapper"
import type { Document } from "@/features/documents/documents.models"
import { getLocale } from "@/utils/get-locale"
import { DeleteDocumentDialog } from "./DeleteDocumentDialog"
import { OpenDocumentUrl } from "./OpenDocumentUrl"

export function DocumentItem({
  document,
  organizationId,
}: {
  document: Document
  organizationId: string
}) {
  const { t } = useTranslation("documents", { keyPrefix: "item" })
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
          <DeleteDocumentDialog organizationId={organizationId} document={document} />
        </div>
      </ItemHeader>

      <ItemContent>
        <div className="flex flex-col gap-2 mb-4 text-muted-foreground">
          <MetaData
            label={t("createdAt")}
            value={format(new Date(document.createdAt), "dd MMMM yyyy HH:mm", {
              locale: getLocale(),
            })}
          />
          <MetaData
            label={t("updatedAt")}
            value={format(new Date(document.updatedAt), "dd MMMM yyyy HH:mm", {
              locale: getLocale(),
            })}
          />
          <MetaData label={t("fileName")} value={document.fileName} />
          <MetaData label={t("fileSize")} value={document.size?.toString()} />
          <MetaData label={t("fileLanguage")} value={document.language} />
          <MetaData label={t("fileMimeType")} value={document.mimeType} />
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
