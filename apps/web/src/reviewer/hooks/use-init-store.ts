import { useEffect, useState } from "react"
import { useAppDispatch } from "@/common/store/hooks"
import { reviewCampaignsTesterActions } from "@/tester/features/review-campaigns/tester.slice"
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
    // Force the lazy combined-reducer to materialize `state.tester` and
    // `state.reviewer` before pages render. Without a dispatch between
    // `inject()` and the first selector read, those slots are undefined
    // and selectors crash on direct access (StrictMode masks this in dev
    // because its cleanup dispatches `reset` for us; prod has no such
    // guarantee).
    dispatch(reviewCampaignsTesterActions.reset())
    dispatch(reviewCampaignsReviewerActions.reset())
    setDone(true)
    return () => {
      resetReviewerSlices(dispatch)
      resetTesterSlices(dispatch)
    }
  }, [dispatch, condition])
  return { initDone: done }
}
