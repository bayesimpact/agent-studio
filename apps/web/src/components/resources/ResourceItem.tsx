import { Item, ItemContent, ItemHeader, ItemTitle } from "@caseai-connect/ui/shad/item"
import { format } from "date-fns"
import { FileIcon } from "lucide-react"
import { MarkdownWrapper } from "@/components/chat/MarkdownWrapper"
import type { Resource } from "@/features/resources/resources.models"
import { getLocale } from "@/utils/get-locale"

export function ResourceItem({ resource }: { resource: Resource }) {
  // FIXME: i18n
  return (
    <Item variant="outline" className="w-full">
      <ItemHeader>
        <ItemTitle>
          <FileIcon />
          {resource.title}
        </ItemTitle>
        {/* // TODO: add actions (edit, delete) */}
      </ItemHeader>

      <ItemContent>
        <div className="flex flex-col gap-2 mb-4 text-muted-foreground">
          <MetaData
            label="Created at"
            value={format(new Date(resource.createdAt), "dd MMMM yyyy HH:mm", {
              locale: getLocale(),
            })}
          />
          <MetaData
            label="Updated at"
            value={format(new Date(resource.updatedAt), "dd MMMM yyyy HH:mm", {
              locale: getLocale(),
            })}
          />
          <MetaData label="File Name" value={resource.fileName} />
          <MetaData label="File Size" value={resource.size?.toString()} />
          <MetaData label="File Language" value={resource.language} />
          <MetaData label="File MIME Type" value={resource.mimeType} />
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
