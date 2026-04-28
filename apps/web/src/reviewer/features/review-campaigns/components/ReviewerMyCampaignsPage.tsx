"use client"

import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ADS } from "@/common/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { buildReviewerCampaignPath } from "@/reviewer/routes/helpers"
import { selectMyReviewerCampaigns } from "../reviewer.selectors"
import { reviewCampaignsReviewerActions } from "../reviewer.slice"
import { MyReviewerCampaignsList } from "./MyReviewerCampaignsList"

export function ReviewerMyCampaignsPage() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const myCampaigns = useAppSelector(selectMyReviewerCampaigns)

  useEffect(() => {
    dispatch(reviewCampaignsReviewerActions.mount())
    return () => {
      dispatch(reviewCampaignsReviewerActions.unmount())
    }
  }, [dispatch])

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t("reviewerCampaigns:myCampaigns.title")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("reviewerCampaigns:myCampaigns.subtitle")}
        </p>
      </header>
      {ADS.isLoading(myCampaigns) && (
        <p className="text-muted-foreground text-sm">
          {t("reviewerCampaigns:myCampaigns.loading")}
        </p>
      )}
      {ADS.isError(myCampaigns) && <p className="text-destructive text-sm">{myCampaigns.error}</p>}
      {ADS.isFulfilled(myCampaigns) && (
        <MyReviewerCampaignsList
          campaigns={myCampaigns.value}
          onOpen={(campaign) =>
            navigate(
              buildReviewerCampaignPath({
                organizationId: campaign.organizationId,
                projectId: campaign.projectId,
                reviewCampaignId: campaign.id,
              }),
            )
          }
        />
      )}
    </div>
  )
}
