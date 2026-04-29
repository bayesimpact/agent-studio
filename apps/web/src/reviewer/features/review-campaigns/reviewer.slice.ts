import { createSlice } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/common/store/async-data-status"
import type {
  ReviewerCampaign,
  ReviewerSessionDetail,
  ReviewerSessionListItem,
} from "./reviewer.models"
import {
  getReviewerSession,
  listMyReviewerCampaigns,
  listReviewerSessions,
  submitReviewerReview,
  updateReviewerReview,
} from "./reviewer.thunks"

interface State {
  myCampaigns: AsyncData<ReviewerCampaign[]>
  sessionsByCampaignId: Record<string, AsyncData<ReviewerSessionListItem[]>>
  sessionDetailBySessionId: Record<string, AsyncData<ReviewerSessionDetail>>
}

const initialState: State = {
  myCampaigns: defaultAsyncData,
  sessionsByCampaignId: {},
  sessionDetailBySessionId: {},
}

const slice = createSlice({
  name: "reviewCampaignsReviewer",
  initialState,
  reducers: {
    reset: () => initialState,
    clearSessionDetail: (state, action: { payload: { sessionId: string } }) => {
      delete state.sessionDetailBySessionId[action.payload.sessionId]
    },
    /**
     * Marker actions dispatched by each reviewer route from a `useEffect`.
     * The reviewer listener middleware reacts to `mount` by reading current
     * URL-driven state (`currentReviewCampaignId`, `currentReviewerSessionId`)
     * and dispatching the appropriate loaders. Mirrors the pattern in
     * `eval/features/evaluation-extraction-runs/evaluation-extraction-runs.middleware.ts`.
     */
    mount: () => {},
    unmount: () => {},
  },
  extraReducers: (builder) => {
    builder
      .addCase(listMyReviewerCampaigns.pending, (state) => {
        if (!ADS.isFulfilled(state.myCampaigns)) state.myCampaigns.status = ADS.Loading
        state.myCampaigns.error = null
      })
      .addCase(listMyReviewerCampaigns.fulfilled, (state, action) => {
        state.myCampaigns = { status: ADS.Fulfilled, error: null, value: action.payload }
      })
      .addCase(listMyReviewerCampaigns.rejected, (state, action) => {
        state.myCampaigns.status = ADS.Error
        state.myCampaigns.error = action.error.message || "Failed to list campaigns"
      })

      .addCase(listReviewerSessions.pending, (state, action) => {
        state.sessionsByCampaignId[action.meta.arg.reviewCampaignId] = {
          status: ADS.Loading,
          error: null,
          value: null,
        }
      })
      .addCase(listReviewerSessions.fulfilled, (state, action) => {
        state.sessionsByCampaignId[action.meta.arg.reviewCampaignId] = {
          status: ADS.Fulfilled,
          error: null,
          value: action.payload,
        }
      })
      .addCase(listReviewerSessions.rejected, (state, action) => {
        state.sessionsByCampaignId[action.meta.arg.reviewCampaignId] = {
          status: ADS.Error,
          error: action.error.message || "Failed to list sessions",
          value: null,
        }
      })

      .addCase(getReviewerSession.pending, (state, action) => {
        state.sessionDetailBySessionId[action.meta.arg.sessionId] = {
          status: ADS.Loading,
          error: null,
          value: null,
        }
      })
      .addCase(getReviewerSession.fulfilled, (state, action) => {
        state.sessionDetailBySessionId[action.meta.arg.sessionId] = {
          status: ADS.Fulfilled,
          error: null,
          value: action.payload,
        }
      })
      .addCase(getReviewerSession.rejected, (state, action) => {
        state.sessionDetailBySessionId[action.meta.arg.sessionId] = {
          status: ADS.Error,
          error: action.error.message || "Failed to load session",
          value: null,
        }
      })

      // On submit/update, invalidate the session detail so the next GET returns
      // the fresh "full" (non-blind) payload.
      .addCase(submitReviewerReview.fulfilled, (state, action) => {
        delete state.sessionDetailBySessionId[action.meta.arg.sessionId]
      })
      .addCase(updateReviewerReview.fulfilled, (state, action) => {
        delete state.sessionDetailBySessionId[action.meta.arg.sessionId]
      })
  },
})

export type { State as ReviewCampaignsReviewerState }
export const reviewCampaignsReviewerInitialState = initialState
export const reviewCampaignsReviewerActions = { ...slice.actions }
export const reviewCampaignsReviewerSlice = slice
