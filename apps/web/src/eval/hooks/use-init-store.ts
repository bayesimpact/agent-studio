import { useEffect, useState } from "react"
import { useAppDispatch } from "@/common/store/hooks"
import { injectEvalSlices, resetEvalSlices } from "../store/slices"

export function useInitStore(condition: boolean) {
  const [done, setDone] = useState(false)
  const dispatch = useAppDispatch()
  useEffect(() => {
    if (!condition) return
    injectEvalSlices()
    setDone(true)
    return () => {
      resetEvalSlices(dispatch)
    }
  }, [dispatch, condition])
  return { initDone: done }
}
