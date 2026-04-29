import { useParams } from "react-router-dom"
import { selectCurrentOrganizationId } from "@/common/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/common/features/projects/projects.selectors"
import { LoadingRoute } from "@/common/routes/LoadingRoute"
import { useAppSelector } from "@/common/store/hooks"
import { CampaignReportPage } from "@/studio/features/review-campaigns/reports/components/CampaignReportPage"
import { buildReviewerCampaignPath } from "./helpers"

type Params = {
  reviewCampaignId: string
}

export function ReviewerReportRoute() {
  const params = useParams<Params>() // FIXME:
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)

  if (!organizationId || !projectId || !params.reviewCampaignId) return <LoadingRoute />

  const backPath = buildReviewerCampaignPath({
    organizationId,
    projectId,
    reviewCampaignId: params.reviewCampaignId,
  })
  return (
    <CampaignReportPage
      backPath={backPath}
      organizationId={organizationId}
      projectId={projectId}
      reviewCampaignId={params.reviewCampaignId}
    />
  )
}
