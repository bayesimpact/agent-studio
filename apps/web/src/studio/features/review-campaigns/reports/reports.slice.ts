import { createSlice } from "@reduxjs/toolkit"
import { ADS, type AsyncData } from "@/common/store/async-data-status"
import type { CampaignReport } from "./reports.models"
import { getCampaignReport } from "./reports.thunks"

interface State {
  reportByCampaignId: Record<string, AsyncData<CampaignReport>>
}

const initialState: State = {
  reportByCampaignId: {},
}

const slice = createSlice({
  name: "reviewCampaignsReports",
  initialState,
  reducers: {
    reset: () => initialState,
    /**
     * Marker actions dispatched by `CampaignReportPage` from a `useEffect`.
     * The reports listener middleware reacts to `mount` by reading
     * `currentReviewCampaignId` and dispatching `getCampaignReport`. See
     * `apps/web/CLAUDE.md` → "Data Loading: Marker Action + Middleware".
     */
    mount: () => {},
    unmount: () => {},
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCampaignReport.pending, (state, action) => {
        state.reportByCampaignId[action.meta.arg.reviewCampaignId] = {
          status: ADS.Loading,
          error: null,
          value: null,
        }
      })
      .addCase(getCampaignReport.fulfilled, (state, action) => {
        state.reportByCampaignId[action.meta.arg.reviewCampaignId] = {
          status: ADS.Fulfilled,
          error: null,
          value: action.payload,
        }
      })
      .addCase(getCampaignReport.rejected, (state, action) => {
        state.reportByCampaignId[action.meta.arg.reviewCampaignId] = {
          status: ADS.Error,
          error: action.error.message || "Failed to load report",
          value: null,
        }
      })
  },
})

export type { State as ReviewCampaignsReportsState }
export const reviewCampaignsReportsInitialState = initialState
export const reviewCampaignsReportsActions = { ...slice.actions }
export const reviewCampaignsReportsSlice = slice
