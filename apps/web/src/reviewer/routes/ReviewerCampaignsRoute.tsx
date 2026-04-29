"use client"

import { useTranslation } from "react-i18next"
import { GridHeader } from "@/common/components/grid/Grid"
import { useMount } from "@/common/hooks/use-mount"
import { AsyncRoute } from "@/common/routes/AsyncRoute"
import { useAppSelector } from "@/common/store/hooks"
import { ReviewerCampaignsList } from "../features/review-campaigns/components/ReviewerCampaignsList"
import type { ReviewerCampaign } from "../features/review-campaigns/reviewer.models"
import { selectMyReviewerCampaigns } from "../features/review-campaigns/reviewer.selectors"
import { reviewCampaignsReviewerActions } from "../features/review-campaigns/reviewer.slice"

export function ReviewerCampaignsRoute() {
  const campaigns = useAppSelector(selectMyReviewerCampaigns)

  useMount({ actions: reviewCampaignsReviewerActions })

  return (
    <AsyncRoute data={[campaigns]}>
      {([campaignsValue]) => <WithData campaigns={campaignsValue} />}
    </AsyncRoute>
  )
}

function WithData({ campaigns }: { campaigns: ReviewerCampaign[] }) {
  const { t } = useTranslation()
  return (
    <>
      <GridHeader
        title={t("reviewerCampaigns:myCampaigns.title")}
        description={t("reviewerCampaigns:myCampaigns.subtitle")}
      />
      <ReviewerCampaignsList campaigns={campaigns} />
    </>
  )
}
