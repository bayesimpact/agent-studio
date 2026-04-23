import { useEffect, useState } from "react"
import { useAppDispatch } from "@/common/store/hooks"
import { injectBackofficeSlices, resetBackofficeSlices } from "../store/slices"

export function useInitStore(condition: boolean) {
  const [done, setDone] = useState(false)
  const dispatch = useAppDispatch()
  useEffect(() => {
    if (!condition) return
    injectBackofficeSlices()
    setDone(true)
    return () => {
      resetBackofficeSlices(dispatch)
    }
  }, [dispatch, condition])
  return { initDone: done }
}
