import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/common/store"
import type { CampaignReport } from "./reports.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }
type CampaignScopeArg = { organizationId: string; projectId: string; reviewCampaignId: string }

export const getCampaignReport = createAsyncThunk<CampaignReport, CampaignScopeArg, ThunkConfig>(
  "reviewCampaigns/reports/get",
  async (params, { extra: { services } }) => {
    return await services.reviewCampaignsReports.getReport(params)
  },
)
