import type { RootState } from "@/common/store"
import { defaultAsyncData } from "@/common/store/async-data-status"

const reviewerState = (state: RootState) => state.reviewCampaignsReviewer

export const selectMyReviewerCampaigns = (state: RootState) =>
  reviewerState(state).myCampaigns ?? defaultAsyncData

export const selectReviewerSessions = (reviewCampaignId: string) => (state: RootState) =>
  reviewerState(state).sessionsByCampaignId[reviewCampaignId] ?? defaultAsyncData

export const selectReviewerSessionDetail = (sessionId: string) => (state: RootState) =>
  reviewerState(state).sessionDetailBySessionId[sessionId] ?? defaultAsyncData
