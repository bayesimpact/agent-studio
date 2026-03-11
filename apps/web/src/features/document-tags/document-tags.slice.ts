import { createSlice } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/store/async-data-status"
import type { DocumentTag } from "./document-tags.models"
import { listDocumentTags } from "./document-tags.thunks"

interface State {
  data: AsyncData<DocumentTag[]>
}

const initialState: State = {
  data: defaultAsyncData,
}

const slice = createSlice({
  name: "documentTags",
  initialState,
  reducers: {
    reset: (state) => {
      state.data = defaultAsyncData
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listDocumentTags.pending, (state) => {
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(listDocumentTags.fulfilled, (state, action) => {
        state.data = {
          status: ADS.Fulfilled,
          error: null,
          value: action.payload,
        }
      })
      .addCase(listDocumentTags.rejected, (state, action) => {
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to list document tags"
      })
  },
})

export type { State as documentTagsState }
export const documentTagsInitialState = initialState
export const documentTagsActions = { ...slice.actions }
export const documentTagsSliceReducer = slice.reducer
