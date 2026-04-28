import { useEffect, useState } from "react"
import { useAppDispatch } from "@/common/store/hooks"
import { reviewCampaignsTesterActions } from "../features/review-campaigns/tester.slice"
import { injectTesterSlices, resetTesterSlices } from "../store/slices"

export function useInitStore(condition: boolean) {
  const [done, setDone] = useState(false)
  const dispatch = useAppDispatch()
  useEffect(() => {
    if (!condition) return
    injectTesterSlices()
    // Force the lazy combined-reducer to materialize `state.tester` before
    // pages render. Without a dispatch between `inject()` and the first
    // selector read, `state.tester` is undefined and selectors crash on
    // direct access (StrictMode masks this in dev because its cleanup
    // dispatches `reset` for us; prod has no such guarantee).
    dispatch(reviewCampaignsTesterActions.reset())
    setDone(true)
    return () => {
      resetTesterSlices(dispatch)
    }
  }, [dispatch, condition])
  return { initDone: done }
}
