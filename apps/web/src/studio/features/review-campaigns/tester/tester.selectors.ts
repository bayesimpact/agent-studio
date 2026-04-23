import type { RootState } from "@/common/store"
import { defaultAsyncData } from "@/common/store/async-data-status"

/**
 * Guarded access: the `studio` slice tree is lazily injected by `TesterShell` /
 * `Studio`. On routes that don't inject it yet (e.g. desk / eval), reading the
 * tree directly would throw. Selectors fall back to uninitialized defaults so
 * the sidebar nav can safely ask "does this user have any campaigns?" from any
 * route.
 */
const testerState = (state: RootState) =>
  (state.studio as RootState["studio"] | undefined)?.reviewCampaignsTester

export const selectMyReviewCampaigns = (state: RootState) =>
  testerState(state)?.myCampaigns ?? defaultAsyncData

export const selectTesterContext = (state: RootState) =>
  testerState(state)?.selectedContext ?? defaultAsyncData

export const selectMyLocalSessions = (campaignId: string) => (state: RootState) =>
  testerState(state)?.mySessionsByCampaignId[campaignId] ?? []

export const selectMySurveyForCampaign = (campaignId: string) => (state: RootState) =>
  testerState(state)?.selectedSurveyByCampaignId[campaignId]
