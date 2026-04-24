import type { RootState } from "@/common/store"
import { defaultAsyncData } from "@/common/store/async-data-status"

const testerState = (state: RootState) => state.reviewCampaignsTester

export const selectMyReviewCampaigns = (state: RootState) =>
  testerState(state).myCampaigns ?? defaultAsyncData

export const selectTesterContext = (state: RootState) =>
  testerState(state).selectedContext ?? defaultAsyncData

export const selectMyLocalSessions = (campaignId: string) => (state: RootState) =>
  testerState(state).mySessionsByCampaignId[campaignId] ?? []

export const selectMySurveyForCampaign = (campaignId: string) => (state: RootState) =>
  testerState(state).selectedSurveyByCampaignId[campaignId]
