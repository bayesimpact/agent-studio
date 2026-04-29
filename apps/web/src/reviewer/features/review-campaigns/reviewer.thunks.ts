import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/common/store"
import type {
  ReviewerCampaign,
  ReviewerSessionDetail,
  ReviewerSessionListItem,
  ReviewerSessionReview,
  SubmitReviewerReviewFields,
  UpdateReviewerReviewFields,
} from "./reviewer.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

type CampaignScopeArg = { organizationId: string; projectId: string; reviewCampaignId: string }
type SessionScopeArg = CampaignScopeArg & { sessionId: string }

export const listMyReviewerCampaigns = createAsyncThunk<ReviewerCampaign[], void, ThunkConfig>(
  "reviewer/listMyCampaigns",
  async (_, { extra: { services } }) => {
    return await services.reviewCampaignsReviewer.listMyCampaigns()
  },
)

export const listReviewerSessions = createAsyncThunk<
  ReviewerSessionListItem[],
  CampaignScopeArg,
  ThunkConfig
>("reviewer/listSessions", async (params, { extra: { services } }) => {
  return await services.reviewCampaignsReviewer.listSessions(params)
})

export const getReviewerSession = createAsyncThunk<
  ReviewerSessionDetail,
  SessionScopeArg,
  ThunkConfig
>("reviewer/getSession", async (params, { extra: { services } }) => {
  return await services.reviewCampaignsReviewer.getSession(params)
})

export const submitReviewerReview = createAsyncThunk<
  ReviewerSessionReview,
  SessionScopeArg & { fields: SubmitReviewerReviewFields },
  ThunkConfig
>("reviewer/submitReview", async ({ fields, ...params }, { extra: { services } }) => {
  return await services.reviewCampaignsReviewer.submitReview(params, fields)
})

export const updateReviewerReview = createAsyncThunk<
  ReviewerSessionReview,
  SessionScopeArg & { reviewId: string; fields: UpdateReviewerReviewFields },
  ThunkConfig
>("reviewer/updateReview", async ({ fields, ...params }, { extra: { services } }) => {
  return await services.reviewCampaignsReviewer.updateReview(params, fields)
})
