import { useEffect, useState } from "react"
import { useAppDispatch } from "@/common/store/hooks"
import { injectStudioSlices, resetStudioSlices } from "../store/slices"

export function useInitStore(condition: boolean) {
  const [done, setDone] = useState(false)
  const dispatch = useAppDispatch()
  useEffect(() => {
    if (!condition) return
    injectStudioSlices()
    setDone(true)
    return () => {
      resetStudioSlices(dispatch)
    }
  }, [dispatch, condition])
  return { initDone: done }
}
