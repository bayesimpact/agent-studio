import { useParams } from "react-router-dom"
import { CampaignReportPage } from "@/studio/features/review-campaigns/reports/components/CampaignReportPage"
import { buildReviewCampaignsPath } from "./helpers"

type Params = {
  organizationId: string
  projectId: string
}

export function ReviewCampaignReportRoute() {
  const params = useParams<Params>()
  if (!params.organizationId || !params.projectId) return null
  const backPath = buildReviewCampaignsPath({
    organizationId: params.organizationId,
    projectId: params.projectId,
  })
  return <CampaignReportPage backPath={backPath} backLabel="Campaigns" />
}
