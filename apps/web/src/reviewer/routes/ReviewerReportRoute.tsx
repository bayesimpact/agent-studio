import { useParams } from "react-router-dom"
import { CampaignReportPage } from "@/studio/features/review-campaigns/reports/components/CampaignReportPage"
import { buildReviewerCampaignPath } from "./helpers"

type Params = {
  organizationId: string
  projectId: string
  reviewCampaignId: string
}

export function ReviewerReportRoute() {
  const params = useParams<Params>() as Params

  return (
    <CampaignReportPage
      backPath={buildReviewerCampaignPath({
        organizationId: params.organizationId,
        projectId: params.projectId,
        reviewCampaignId: params.reviewCampaignId,
      })}
      organizationId={params.organizationId}
      projectId={params.projectId}
      reviewCampaignId={params.reviewCampaignId}
    />
  )
}
