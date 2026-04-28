import type { RootState } from "@/common/store"
import { defaultAsyncData } from "@/common/store/async-data-status"

// `state.reviewer` is dynamically injected by `injectReviewerSlices` (see
// apps/web/src/reviewer/store/slices.ts) and torn down by `resetReviewerSlices`,
// so it can be `undefined` outside the reviewer scope OR briefly during
// scope mount/unmount. RootState types it as required, but at runtime it
// isn't — keep these selectors defensive so subscribed components don't
// crash if they read during the gap.
const reviewerState = (state: RootState) => state.reviewer?.reviewCampaignsReviewer

export const selectMyReviewerCampaigns = (state: RootState) =>
  reviewerState(state)?.myCampaigns ?? defaultAsyncData

export const selectReviewerSessions = (reviewCampaignId: string) => (state: RootState) =>
  reviewerState(state)?.sessionsByCampaignId[reviewCampaignId] ?? defaultAsyncData

export const selectReviewerSessionDetail = (sessionId: string) => (state: RootState) =>
  reviewerState(state)?.sessionDetailBySessionId[sessionId] ?? defaultAsyncData
