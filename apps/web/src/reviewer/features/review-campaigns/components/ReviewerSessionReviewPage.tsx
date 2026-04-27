"use client"

import type {
  SubmitReviewerSessionReviewRequestDto,
  UpdateReviewerSessionReviewRequestDto,
} from "@caseai-connect/api-contracts"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { ADS } from "@/common/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { buildReviewerCampaignPath } from "@/reviewer/routes/helpers"
import { selectReviewerSessionDetail } from "../reviewer.selectors"
import { getReviewerSession, submitReviewerReview, updateReviewerReview } from "../reviewer.thunks"
import { ReviewerSessionReview } from "./ReviewerSessionReview"

type Params = {
  organizationId: string
  projectId: string
  reviewCampaignId: string
  sessionId: string
}

export function ReviewerSessionReviewPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const params = useParams<Params>()
  const detailState = useAppSelector(selectReviewerSessionDetail(params.sessionId ?? ""))

  useEffect(() => {
    if (
      !params.organizationId ||
      !params.projectId ||
      !params.reviewCampaignId ||
      !params.sessionId
    )
      return
    dispatch(
      getReviewerSession({
        organizationId: params.organizationId,
        projectId: params.projectId,
        reviewCampaignId: params.reviewCampaignId,
        sessionId: params.sessionId,
      }),
    )
  }, [dispatch, params.organizationId, params.projectId, params.reviewCampaignId, params.sessionId])

  if (!params.organizationId || !params.projectId || !params.reviewCampaignId || !params.sessionId)
    return null

  const handleSubmit = async (payload: SubmitReviewerSessionReviewRequestDto) => {
    if (
      !params.sessionId ||
      !params.organizationId ||
      !params.projectId ||
      !params.reviewCampaignId
    )
      return
    await dispatch(
      submitReviewerReview({
        organizationId: params.organizationId,
        projectId: params.projectId,
        reviewCampaignId: params.reviewCampaignId,
        sessionId: params.sessionId,
        fields: payload,
      }),
    ).unwrap()
    // Slice invalidates the detail cache; re-fetch the freshly "full" payload.
    dispatch(
      getReviewerSession({
        organizationId: params.organizationId,
        projectId: params.projectId,
        reviewCampaignId: params.reviewCampaignId,
        sessionId: params.sessionId,
      }),
    )
  }

  const handleUpdate = async (payload: UpdateReviewerSessionReviewRequestDto) => {
    if (
      !params.sessionId ||
      !params.organizationId ||
      !params.projectId ||
      !params.reviewCampaignId ||
      !ADS.isFulfilled(detailState) ||
      detailState.value.blind
    )
      return
    await dispatch(
      updateReviewerReview({
        organizationId: params.organizationId,
        projectId: params.projectId,
        reviewCampaignId: params.reviewCampaignId,
        sessionId: params.sessionId,
        reviewId: detailState.value.myReview.id,
        fields: payload,
      }),
    ).unwrap()
    dispatch(
      getReviewerSession({
        organizationId: params.organizationId,
        projectId: params.projectId,
        reviewCampaignId: params.reviewCampaignId,
        sessionId: params.sessionId,
      }),
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <button
        type="button"
        className="text-muted-foreground w-fit text-sm hover:underline"
        onClick={() => {
          if (!params.organizationId || !params.projectId || !params.reviewCampaignId) return
          navigate(
            buildReviewerCampaignPath({
              organizationId: params.organizationId,
              projectId: params.projectId,
              reviewCampaignId: params.reviewCampaignId,
            }),
          )
        }}
      >
        {t("reviewerCampaigns:sessionPage.back")}
      </button>

      {ADS.isLoading(detailState) && (
        <p className="text-muted-foreground text-sm">
          {t("reviewerCampaigns:sessionPage.loading")}
        </p>
      )}
      {ADS.isError(detailState) && <p className="text-destructive text-sm">{detailState.error}</p>}
      {ADS.isFulfilled(detailState) && (
        <ReviewerSessionReview
          session={detailState.value}
          onSubmitReview={handleSubmit}
          onUpdateReview={handleUpdate}
        />
      )}
    </div>
  )
}
