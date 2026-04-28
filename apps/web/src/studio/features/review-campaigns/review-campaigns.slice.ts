import { createSlice } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/common/store/async-data-status"
import type { ReviewCampaignDetail, ReviewCampaignListItem } from "./review-campaigns.models"
import { getReviewCampaignDetail, listReviewCampaigns } from "./review-campaigns.thunks"

interface State {
  data: AsyncData<ReviewCampaignListItem[]>
  selectedDetail: AsyncData<ReviewCampaignDetail>
}

const initialState: State = {
  data: defaultAsyncData,
  selectedDetail: defaultAsyncData,
}

const slice = createSlice({
  name: "reviewCampaigns",
  initialState,
  reducers: {
    reset: () => initialState,
    clearSelectedDetail: (state) => {
      state.selectedDetail = defaultAsyncData
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listReviewCampaigns.pending, (state) => {
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(listReviewCampaigns.fulfilled, (state, action) => {
        state.data = {
          status: ADS.Fulfilled,
          error: null,
          value: [...action.payload].sort((a, b) => b.createdAt - a.createdAt),
        }
      })
      .addCase(listReviewCampaigns.rejected, (state, action) => {
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to list review campaigns"
      })
      .addCase(getReviewCampaignDetail.pending, (state) => {
        if (!ADS.isFulfilled(state.selectedDetail)) {
          state.selectedDetail.status = ADS.Loading
        }
        state.selectedDetail.error = null
      })
      .addCase(getReviewCampaignDetail.fulfilled, (state, action) => {
        state.selectedDetail = {
          status: ADS.Fulfilled,
          error: null,
          value: action.payload,
        }
      })
      .addCase(getReviewCampaignDetail.rejected, (state, action) => {
        state.selectedDetail.status = ADS.Error
        state.selectedDetail.error = action.error.message || "Failed to load review campaign detail"
      })
  },
})

export type { State as ReviewCampaignsState }
export const reviewCampaignsInitialState = initialState
export const reviewCampaignsActions = { ...slice.actions }
export const reviewCampaignsSlice = slice
