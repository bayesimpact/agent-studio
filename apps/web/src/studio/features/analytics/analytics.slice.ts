import { createSlice } from "@reduxjs/toolkit"
import { ADS, type AsyncData } from "@/store/async-data-status"
import type { AnalyticsDailyPoint } from "./analytics.models"
import { loadProjectAnalytics } from "./analytics.thunks"

interface State {
  conversationsPerDay: AsyncData<AnalyticsDailyPoint[]>
  avgUserQuestionsPerSessionPerDay: AsyncData<AnalyticsDailyPoint[]>
}

const emptySeries: AsyncData<AnalyticsDailyPoint[]> = {
  status: ADS.Uninitialized,
  error: null,
  value: null,
}

const initialState: State = {
  conversationsPerDay: { ...emptySeries },
  avgUserQuestionsPerSessionPerDay: { ...emptySeries },
}

const slice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadProjectAnalytics.pending, (state) => {
        if (!ADS.isFulfilled(state.conversationsPerDay)) {
          state.conversationsPerDay.status = ADS.Loading
        }
        if (!ADS.isFulfilled(state.avgUserQuestionsPerSessionPerDay)) {
          state.avgUserQuestionsPerSessionPerDay.status = ADS.Loading
        }
        state.conversationsPerDay.error = null
        state.avgUserQuestionsPerSessionPerDay.error = null
      })
      .addCase(loadProjectAnalytics.fulfilled, (state, action) => {
        state.conversationsPerDay = {
          status: ADS.Fulfilled,
          error: null,
          value: action.payload.conversationsPerDay,
        }
        state.avgUserQuestionsPerSessionPerDay = {
          status: ADS.Fulfilled,
          error: null,
          value: action.payload.avgUserQuestionsPerSessionPerDay,
        }
      })
      .addCase(loadProjectAnalytics.rejected, (state, action) => {
        const message = action.error.message || "Failed to load analytics"
        state.conversationsPerDay = {
          status: ADS.Error,
          error: message,
          value: null,
        }
        state.avgUserQuestionsPerSessionPerDay = {
          status: ADS.Error,
          error: message,
          value: null,
        }
      })
  },
})

export type { State as AnalyticsState }
export const analyticsInitialState = initialState
export const analyticsActions = { ...slice.actions }
export const analyticsSlice = slice
