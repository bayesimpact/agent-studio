"use client"

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ADS } from "@/common/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { buildReviewerCampaignPath } from "@/reviewer/routes/helpers"
import { selectMyReviewerCampaigns } from "../reviewer.selectors"
import { listMyReviewerCampaigns } from "../reviewer.thunks"
import { MyReviewerCampaignsList } from "./MyReviewerCampaignsList"

export function ReviewerMyCampaignsPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const myCampaigns = useAppSelector(selectMyReviewerCampaigns)

  useEffect(() => {
    dispatch(listMyReviewerCampaigns())
  }, [dispatch])

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">My review campaigns</h1>
        <p className="text-muted-foreground text-sm">Active campaigns where you're a reviewer.</p>
      </header>
      {ADS.isLoading(myCampaigns) && <p className="text-muted-foreground text-sm">Loading…</p>}
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
