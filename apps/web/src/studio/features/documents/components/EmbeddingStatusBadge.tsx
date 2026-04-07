import { Badge, type BadgeVariant } from "@caseai-connect/ui/shad/badge"
import { Loader2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Document } from "@/studio/features/documents/documents.models"

export function EmbeddingStatusBadge({ status }: { status: Document["embeddingStatus"] }) {
  const { t } = useTranslation("document", { keyPrefix: "props.embeddingStatuses" })
  const normalizedStatus = status === "pending" ? "processing" : status

  const statusBadgeVariant: Record<Document["embeddingStatus"], BadgeVariant> = {
    pending: "outline",
    processing: "outline",
    completed: "success",
    failed: "destructive",
  }

  return (
    <Badge variant={statusBadgeVariant[status]} className="gap-1.5">
      {normalizedStatus === "processing" && <Loader2Icon className="size-3 animate-spin" />}
      {t(normalizedStatus)}
    </Badge>
  )
}
