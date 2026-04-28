import type { RootState } from "@/common/store"
import { defaultAsyncData } from "@/common/store/async-data-status"

// `state.tester` is dynamically injected by `injectTesterSlices` (see
// apps/web/src/tester/store/slices.ts) and torn down by `resetTesterSlices`,
// so it can be `undefined` outside the tester scope OR briefly during
// scope mount/unmount. RootState types it as required, but at runtime it
// isn't — keep these selectors defensive so subscribed components don't
// crash if they read during the gap.
const testerState = (state: RootState) => state.tester?.reviewCampaignsTester

export const selectMyReviewCampaigns = (state: RootState) =>
  testerState(state)?.myCampaigns ?? defaultAsyncData

export const selectTesterContext = (state: RootState) =>
  testerState(state)?.selectedContext ?? defaultAsyncData

export const selectMyLocalSessions = (campaignId: string) => (state: RootState) =>
  testerState(state)?.mySessionsByCampaignId[campaignId] ?? []

export const selectMySurveyForCampaign = (campaignId: string) => (state: RootState) =>
  testerState(state)?.selectedSurveyByCampaignId[campaignId]
