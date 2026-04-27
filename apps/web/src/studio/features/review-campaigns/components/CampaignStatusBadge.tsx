import type { ReviewCampaignStatus } from "@caseai-connect/api-contracts"
import { Badge } from "@caseai-connect/ui/shad/badge"
import { useTranslation } from "react-i18next"

const VARIANT_BY_STATUS: Record<
  ReviewCampaignStatus,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  draft: "outline",
  active: "success",
  closed: "secondary",
}

export function CampaignStatusBadge({ status }: { status: ReviewCampaignStatus }) {
  const { t } = useTranslation()
  return <Badge variant={VARIANT_BY_STATUS[status]}>{t(`reviewCampaigns:status.${status}`)}</Badge>
}
