import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

type State = {
  value: string | null
}

const initialState: State = {
  value: null,
}

const slice = createSlice({
  name: "currentReviewCampaignId",
  initialState,
  reducers: {
    setCurrentReviewCampaignId: (
      state,
      action: PayloadAction<{ reviewCampaignId: string | null }>,
    ) => {
      state.value = action.payload.reviewCampaignId
    },
    reset: () => initialState,
  },
})

export type { State as currentReviewCampaignIdState }
export const currentReviewCampaignIdInitialState = initialState
export const currentReviewCampaignIdActions = { ...slice.actions }
export const currentReviewCampaignIdSlice = slice
