import { useEffect, useState } from "react"
import { useAppDispatch } from "@/common/store/hooks"
import { injectTesterSlices, resetTesterSlices } from "@/tester/store/slices"
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
    setDone(true)
    return () => {
      resetReviewerSlices(dispatch)
      resetTesterSlices(dispatch)
    }
  }, [dispatch, condition])
  return { initDone: done }
}
