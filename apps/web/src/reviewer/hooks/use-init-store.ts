import { useEffect, useState } from "react"
import { useAppDispatch } from "@/common/store/hooks"
import { injectTesterSlices, resetTesterSlices } from "@/tester/store/slices"
import { reviewCampaignsReviewerActions } from "../features/review-campaigns/reviewer.slice"
import { injectReviewerSlices, resetReviewerSlices } from "../store/slices"

/**
 * Reviewer reuses the tester slice for shared campaign-context data
 * (`getTesterContext`, `selectTesterContext`) — so we inject both. Reset
 * mirrors that order.
 */
export function useInitStore(condition: boolean) {
  const [done, setDone] = useState(false)
  const dispatch = useAppDispatch()
  useEffect(() => {
    if (!condition) return
    injectTesterSlices()
    injectReviewerSlices()
    // Tell the reviewer middleware that the scope is now active so it can
    // bootstrap (e.g. listMyReviewerCampaigns). The tester scope marker is
    // intentionally not dispatched here — reviewers piggyback on tester
    // selectors but are not in the tester scope.
    dispatch(reviewCampaignsReviewerActions.enteredScope())
    setDone(true)
    return () => {
      resetReviewerSlices(dispatch)
      resetTesterSlices(dispatch)
    }
  }, [dispatch, condition])
  return { initDone: done }
}
