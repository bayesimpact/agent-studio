import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

type State = {
  value: string | null
}

const initialState: State = {
  value: null,
}

const slice = createSlice({
  name: "currentReviewerSessionId",
  initialState,
  reducers: {
    setCurrentReviewerSessionId: (
      state,
      action: PayloadAction<{ reviewerSessionId: string | null }>,
    ) => {
      state.value = action.payload.reviewerSessionId
    },
    reset: () => initialState,
  },
})

export type { State as currentReviewerSessionIdState }
export const currentReviewerSessionIdInitialState = initialState
export const currentReviewerSessionIdActions = { ...slice.actions }
export const currentReviewerSessionIdSlice = slice
