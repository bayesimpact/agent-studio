import { Item, ItemContent, ItemHeader, ItemTitle } from "@caseai-connect/ui/shad/item"
import { format } from "date-fns"
import { FileIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { MarkdownWrapper } from "@/components/chat/MarkdownWrapper"
import type { Resource } from "@/features/resources/resources.models"
import { getLocale } from "@/utils/get-locale"
import { DeleteResourceDialog } from "./DeleteResourceDialog"

export function ResourceItem({
  resource,
  organizationId,
}: {
  resource: Resource
  organizationId: string
}) {
  const { t } = useTranslation("resources", { keyPrefix: "item" })
  return (
    <Item variant="outline" className="w-full">
      <ItemHeader>
        <ItemTitle>
          <FileIcon />
          {resource.title}
        </ItemTitle>
        <DeleteResourceDialog organizationId={organizationId} resource={resource} />
      </ItemHeader>

      <ItemContent>
        <div className="flex flex-col gap-2 mb-4 text-muted-foreground">
          <MetaData
            label={t("createdAt")}
            value={format(new Date(resource.createdAt), "dd MMMM yyyy HH:mm", {
              locale: getLocale(),
            })}
          />
          <MetaData
            label={t("updatedAt")}
            value={format(new Date(resource.updatedAt), "dd MMMM yyyy HH:mm", {
              locale: getLocale(),
            })}
          />
          <MetaData label={t("fileName")} value={resource.fileName} />
          <MetaData label={t("fileSize")} value={resource.size?.toString()} />
          <MetaData label={t("fileLanguage")} value={resource.language} />
          <MetaData label={t("fileMimeType")} value={resource.mimeType} />
        </div>

        {resource.content && <MarkdownWrapper content={resource.content} />}
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
