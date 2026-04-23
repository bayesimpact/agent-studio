import type { ReviewCampaignStatus } from "@caseai-connect/api-contracts"
import { Badge } from "@caseai-connect/ui/shad/badge"

const VARIANT_BY_STATUS: Record<
  ReviewCampaignStatus,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  draft: "outline",
  active: "success",
  closed: "secondary",
}

const LABEL_BY_STATUS: Record<ReviewCampaignStatus, string> = {
  draft: "Draft",
  active: "Active",
  closed: "Closed",
}

export function CampaignStatusBadge({ status }: { status: ReviewCampaignStatus }) {
  return <Badge variant={VARIANT_BY_STATUS[status]}>{LABEL_BY_STATUS[status]}</Badge>
}
