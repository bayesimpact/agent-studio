import { useEffect } from "react"
import { ADS } from "@/common/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { selectMyReviewerCampaigns } from "./reviewer.selectors"
import { listMyReviewerCampaigns } from "./reviewer.thunks"

/**
 * Fires `listMyReviewerCampaigns` once and exposes whether the caller has any
 * active reviewer campaigns. Mirrors `useMyReviewCampaigns` (the tester side)
 * so Onboarding / sidebar can ask "does this user have any reviewer campaigns?"
 * from any route.
 */
export function useMyReviewerCampaigns() {
  const dispatch = useAppDispatch()
  const data = useAppSelector(selectMyReviewerCampaigns)

  useEffect(() => {
    if (ADS.isUninitialized(data)) {
      dispatch(listMyReviewerCampaigns())
    }
  }, [dispatch, data])

  const hasCampaigns = ADS.isFulfilled(data) && data.value.length > 0
  return { data, hasCampaigns }
}
