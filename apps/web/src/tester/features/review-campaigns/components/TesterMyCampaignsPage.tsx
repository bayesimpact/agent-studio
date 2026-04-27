"use client"

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ADS } from "@/common/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { buildTesterCampaignPath } from "@/tester/routes/helpers"
import { selectMyReviewCampaigns } from "../tester.selectors"
import { listMyReviewCampaigns } from "../tester.thunks"
import { MyCampaignsList } from "./MyCampaignsList"

export function TesterMyCampaignsPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const myCampaigns = useAppSelector(selectMyReviewCampaigns)

  useEffect(() => {
    dispatch(listMyReviewCampaigns())
  }, [dispatch])

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">My review campaigns</h1>
        <p className="text-muted-foreground text-sm">
          Active campaigns you've been invited to test.
        </p>
      </header>

      {ADS.isLoading(myCampaigns) && <p className="text-muted-foreground text-sm">Loading…</p>}
      {ADS.isError(myCampaigns) && <p className="text-destructive text-sm">{myCampaigns.error}</p>}
      {ADS.isFulfilled(myCampaigns) && (
        <MyCampaignsList
          campaigns={myCampaigns.value}
          onOpen={(campaign) =>
            navigate(
              buildTesterCampaignPath({
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
