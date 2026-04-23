import { useEffect } from "react"
import { ADS } from "@/common/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { selectMyReviewCampaigns } from "./tester.selectors"
import { listMyReviewCampaigns } from "./tester.thunks"

/**
 * Fires `listMyReviewCampaigns` once and exposes whether the caller has any
 * active tester campaigns. Used to conditionally render the "My review campaigns"
 * nav entry — we don't want to show it to users who've never been invited.
 */
export function useMyReviewCampaigns() {
  const dispatch = useAppDispatch()
  const data = useAppSelector(selectMyReviewCampaigns)

  useEffect(() => {
    if (ADS.isUninitialized(data)) {
      dispatch(listMyReviewCampaigns())
    }
  }, [dispatch, data])

  const hasCampaigns = ADS.isFulfilled(data) && data.value.length > 0
  return { data, hasCampaigns }
}
