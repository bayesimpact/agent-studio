import { useEffect, useState } from "react"
import { useAppDispatch } from "@/common/store/hooks"
import type { AppDispatch } from "../store"

export function useInitStore({
  condition,
  inject,
  reset,
}: {
  condition: boolean
  inject: () => void
  reset: (dispatch: AppDispatch) => void
}) {
  const [done, setDone] = useState(false)
  const dispatch = useAppDispatch()
  useEffect(() => {
    if (!condition) return
    inject()
    // combineSlices().inject() does not materialize the new slice state in
    // getState() until the next dispatch — force one before children mount,
    // otherwise their selectors read undefined slice state.
    dispatch({ type: "@@init-store/slices-injected" })
    setDone(true)
    return () => {
      reset(dispatch)
    }
  }, [inject, reset, condition, dispatch])
  return { initDone: done }
}
