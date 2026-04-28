"use client"

import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { ADS } from "@/common/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { buildReviewerReportPath, buildReviewerSessionPath } from "@/reviewer/routes/helpers"
import { selectTesterContext } from "@/tester/features/review-campaigns/tester.selectors"
import { selectReviewerSessions } from "../reviewer.selectors"
import { reviewCampaignsReviewerActions } from "../reviewer.slice"
import { ReviewerCampaignLanding } from "./ReviewerCampaignLanding"

type Params = {
  organizationId: string
  projectId: string
  reviewCampaignId: string
}

/**
 * Reuses the tester `getTesterContext` endpoint to fetch campaign name +
 * description + target agent snapshot — the reviewer spec deliberately reuses
 * the same shape rather than duplicating a "reviewer-context" endpoint. The
 * fetch is dispatched by the reviewer listener middleware on `mount`, which
 * the route fires from useEffect, alongside `listReviewerSessions`.
 */
export function ReviewerCampaignLandingPage() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const params = useParams<Params>()

  const contextState = useAppSelector(selectTesterContext)
  const sessionsState = useAppSelector(selectReviewerSessions(params.reviewCampaignId ?? ""))

  useEffect(() => {
    dispatch(reviewCampaignsReviewerActions.mount())
    return () => {
      dispatch(reviewCampaignsReviewerActions.unmount())
    }
  }, [dispatch])

  if (!params.organizationId || !params.projectId || !params.reviewCampaignId) return null

  if (ADS.isLoading(contextState)) {
    return (
      <p className="p-6 text-muted-foreground text-sm">{t("reviewerCampaigns:landing.loading")}</p>
    )
  }
  if (ADS.isError(contextState)) {
    return <p className="p-6 text-destructive text-sm">{contextState.error}</p>
  }
  if (!ADS.isFulfilled(contextState)) return null

  const sessions = ADS.isFulfilled(sessionsState) ? sessionsState.value : []

  return (
    <ReviewerCampaignLanding
      context={contextState.value}
      sessions={sessions}
      onOpenSession={(sessionId) => {
        if (!params.organizationId || !params.projectId || !params.reviewCampaignId) return
        navigate(
          buildReviewerSessionPath({
            organizationId: params.organizationId,
            projectId: params.projectId,
            reviewCampaignId: params.reviewCampaignId,
            sessionId,
          }),
        )
      }}
      onOpenReport={() => {
        if (!params.organizationId || !params.projectId || !params.reviewCampaignId) return
        navigate(
          buildReviewerReportPath({
            organizationId: params.organizationId,
            projectId: params.projectId,
            reviewCampaignId: params.reviewCampaignId,
          }),
        )
      }}
    />
  )
}
