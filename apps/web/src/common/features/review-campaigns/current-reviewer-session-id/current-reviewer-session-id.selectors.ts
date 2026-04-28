import type { RootState } from "@/common/store"

export const selectCurrentReviewerSessionId = (state: RootState) =>
  state.currentReviewerSessionId.value

export const hasReviewerSessionIdChanged = (originalState: RootState, currentState: RootState) => {
  const prevId = selectCurrentReviewerSessionId(originalState)
  const nextId = selectCurrentReviewerSessionId(currentState)
  return prevId !== nextId
}
