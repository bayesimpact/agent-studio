import type { RootState } from "@/common/store"
import { defaultAsyncData } from "@/common/store/async-data-status"

const reportsState = (state: RootState) => state.reviewCampaignsReports

export const selectCampaignReport = (reviewCampaignId: string) => (state: RootState) =>
  reportsState(state).reportByCampaignId[reviewCampaignId] ?? defaultAsyncData
