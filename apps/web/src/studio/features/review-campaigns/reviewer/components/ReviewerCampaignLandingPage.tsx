"use client"

import { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ADS } from "@/common/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { buildReviewerSessionPath } from "@/studio/routes/helpers"
import { selectTesterContext } from "../../tester/tester.selectors"
import { getTesterContext } from "../../tester/tester.thunks"
import { selectReviewerSessions } from "../reviewer.selectors"
import { listReviewerSessions } from "../reviewer.thunks"
import { ReviewerCampaignLanding } from "./ReviewerCampaignLanding"

type Params = {
  organizationId: string
  projectId: string
  reviewCampaignId: string
}

/**
 * Reuses the tester `getTesterContext` endpoint to fetch campaign name +
 * description + target agent snapshot — the reviewer spec deliberately reuses
 * the same shape rather than duplicating a "reviewer-context" endpoint.
 * Reviewer-specific data (the session list) is fetched by `listReviewerSessions`.
 */
export function ReviewerCampaignLandingPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const params = useParams<Params>()

  const contextState = useAppSelector(selectTesterContext)
  const sessionsState = useAppSelector(selectReviewerSessions(params.reviewCampaignId ?? ""))

  useEffect(() => {
    if (!params.organizationId || !params.projectId || !params.reviewCampaignId) return
    const scope = {
      organizationId: params.organizationId,
      projectId: params.projectId,
      reviewCampaignId: params.reviewCampaignId,
    }
    dispatch(getTesterContext(scope))
    dispatch(listReviewerSessions(scope))
  }, [dispatch, params.organizationId, params.projectId, params.reviewCampaignId])

  if (!params.organizationId || !params.projectId || !params.reviewCampaignId) return null

  if (ADS.isLoading(contextState)) {
    return <p className="p-6 text-muted-foreground text-sm">Loading…</p>
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
    />
  )
}
