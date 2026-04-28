import { useEffect, useState } from "react"
import { useAppDispatch } from "@/common/store/hooks"
import { injectTesterSlices, resetTesterSlices } from "../store/slices"

export function useInitStore(condition: boolean) {
  const [done, setDone] = useState(false)
  const dispatch = useAppDispatch()
  useEffect(() => {
    if (!condition) return
    injectTesterSlices()
    setDone(true)
    return () => {
      resetTesterSlices(dispatch)
    }
  }, [dispatch, condition])
  return { initDone: done }
}
