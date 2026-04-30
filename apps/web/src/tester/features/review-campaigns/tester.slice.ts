import { createSlice } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/common/store/async-data-status"
import type {
  MyReviewCampaign,
  TesterCampaignSurvey,
  TesterContext,
  TesterSessionFeedback,
} from "./tester.models"
import {
  deleteTesterSession,
  getMyTesterSurvey,
  getTesterContext,
  listMyReviewCampaigns,
  listMyTesterSessions,
  startTesterSession,
  submitTesterFeedback,
  submitTesterSurvey,
  updateTesterFeedback,
  updateTesterSurvey,
} from "./tester.thunks"

export type LocalSessionSummary = {
  id: string
  startedAt: number
  feedbackStatus: "submitted" | "pending" | "abandoned"
}

interface State {
  myCampaigns: AsyncData<MyReviewCampaign[]>
  selectedContext: AsyncData<TesterContext>
  selectedFeedbackBySessionId: Record<string, TesterSessionFeedback>
  selectedSurveyByCampaignId: Record<string, TesterCampaignSurvey>
  /**
   * Sessions belonging to the current user for each campaign. Hydrated from the
   * server by `listMyTesterSessions`; appended to immediately on `startTesterSession`
   * so the landing shows the new session without waiting for a refetch.
   */
  mySessionsByCampaignId: Record<string, LocalSessionSummary[]>
}

const initialState: State = {
  myCampaigns: defaultAsyncData,
  selectedContext: defaultAsyncData,
  selectedFeedbackBySessionId: {},
  selectedSurveyByCampaignId: {},
  mySessionsByCampaignId: {},
}

const slice = createSlice({
  name: "reviewCampaignsTester",
  initialState,
  reducers: {
    reset: () => initialState,
    clearSelectedContext: (state) => {
      state.selectedContext = defaultAsyncData
    },
    /**
     * Marker actions dispatched by each tester route from a `useEffect`.
     * The tester listener middleware reacts to `mount` by reading current
     * URL-driven state (`currentReviewCampaignId`, `currentAgentSessionId`)
     * and dispatching the appropriate loaders. Mirrors the pattern in
     * `eval/features/evaluation-extraction-runs/evaluation-extraction-runs.middleware.ts`.
     */
    mount: () => {},
    unmount: () => {},
    sessionMount: () => {},
    sessionUnmount: () => {},
  },
  extraReducers: (builder) => {
    builder
      .addCase(listMyReviewCampaigns.pending, (state) => {
        if (!ADS.isFulfilled(state.myCampaigns)) state.myCampaigns.status = ADS.Loading
        state.myCampaigns.error = null
      })
      .addCase(listMyReviewCampaigns.fulfilled, (state, action) => {
        state.myCampaigns = {
          status: ADS.Fulfilled,
          error: null,
          value: action.payload,
        }
      })
      .addCase(listMyReviewCampaigns.rejected, (state, action) => {
        state.myCampaigns.status = ADS.Error
        state.myCampaigns.error = action.error.message || "Failed to list review campaigns"
      })
      .addCase(getTesterContext.pending, (state) => {
        if (!ADS.isFulfilled(state.selectedContext)) state.selectedContext.status = ADS.Loading
        state.selectedContext.error = null
      })
      .addCase(getTesterContext.fulfilled, (state, action) => {
        state.selectedContext = {
          status: ADS.Fulfilled,
          error: null,
          value: action.payload,
        }
      })
      .addCase(getTesterContext.rejected, (state, action) => {
        state.selectedContext.status = ADS.Error
        state.selectedContext.error = action.error.message || "Failed to load campaign context"
      })
      .addCase(listMyTesterSessions.fulfilled, (state, action) => {
        const campaignId = action.meta.arg.reviewCampaignId
        state.mySessionsByCampaignId[campaignId] = action.payload.map((summary) => ({
          id: summary.sessionId,
          startedAt: summary.startedAt,
          feedbackStatus: summary.feedbackStatus,
        }))
      })
      .addCase(startTesterSession.fulfilled, (state, action) => {
        const campaignId = action.meta.arg.reviewCampaignId
        const existing = state.mySessionsByCampaignId[campaignId] ?? []
        state.mySessionsByCampaignId[campaignId] = [
          {
            id: action.payload.sessionId,
            startedAt: Date.now(),
            feedbackStatus: "pending",
          },
          ...existing,
        ]
      })
      .addCase(submitTesterFeedback.fulfilled, (state, action) => {
        state.selectedFeedbackBySessionId[action.payload.sessionId] = action.payload
        const campaignId = action.payload.campaignId
        const sessions = state.mySessionsByCampaignId[campaignId]
        if (sessions) {
          state.mySessionsByCampaignId[campaignId] = sessions.map((session) =>
            session.id === action.payload.sessionId
              ? { ...session, feedbackStatus: "submitted" }
              : session,
          )
        }
      })
      .addCase(updateTesterFeedback.fulfilled, (state, action) => {
        state.selectedFeedbackBySessionId[action.payload.sessionId] = action.payload
      })
      .addCase(submitTesterSurvey.fulfilled, (state, action) => {
        state.selectedSurveyByCampaignId[action.payload.campaignId] = action.payload
      })
      .addCase(updateTesterSurvey.fulfilled, (state, action) => {
        state.selectedSurveyByCampaignId[action.payload.campaignId] = action.payload
      })
      .addCase(getMyTesterSurvey.fulfilled, (state, action) => {
        const campaignId = action.meta.arg.reviewCampaignId
        if (action.payload) {
          state.selectedSurveyByCampaignId[campaignId] = action.payload
        } else {
          delete state.selectedSurveyByCampaignId[campaignId]
        }
      })
      .addCase(deleteTesterSession.fulfilled, (state, action) => {
        const { reviewCampaignId, sessionId } = action.meta.arg
        const sessions = state.mySessionsByCampaignId[reviewCampaignId]
        if (sessions) {
          state.mySessionsByCampaignId[reviewCampaignId] = sessions.filter(
            (session) => session.id !== sessionId,
          )
        }
      })
  },
})

export type { State as ReviewCampaignsTesterState }
export const reviewCampaignsTesterInitialState = initialState
export const reviewCampaignsTesterActions = { ...slice.actions }
export const reviewCampaignsTesterSlice = slice
