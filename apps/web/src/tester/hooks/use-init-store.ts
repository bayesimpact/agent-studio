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
    // Tell the tester middleware that the scope is now active so it can
    // bootstrap (e.g. listMyReviewCampaigns). Doing it here keeps page
    // components free of fetch-on-mount useEffects.
    dispatch(reviewCampaignsTesterActions.enteredScope())
    setDone(true)
    return () => {
      resetTesterSlices(dispatch)
    }
  }, [dispatch, condition])
  return { initDone: done }
}
