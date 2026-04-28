import type { RootState } from "@/common/store"

export const selectCurrentReviewCampaignId = (state: RootState) =>
  state.currentReviewCampaignId.value

export const hasReviewCampaignIdChanged = (originalState: RootState, currentState: RootState) => {
  const prevId = selectCurrentReviewCampaignId(originalState)
  const nextId = selectCurrentReviewCampaignId(currentState)
  return prevId !== nextId
}
