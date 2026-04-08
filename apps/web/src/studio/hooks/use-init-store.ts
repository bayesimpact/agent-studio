import { useEffect } from "react"
import { useAppDispatch } from "@/common/store/hooks"
import { injectStudioSlices, resetStudioSlices } from "../store/slices"

export function useInitStore(condition: boolean) {
  const dispatch = useAppDispatch()
  useEffect(() => {
    if (!condition) return
    injectStudioSlices()
    return () => {
      resetStudioSlices(dispatch)
    }
  }, [dispatch, condition])
}
