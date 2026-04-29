import type { ActionCreatorWithoutPayload } from "@reduxjs/toolkit"
import { useEffect } from "react"
import { useAppDispatch } from "../store/hooks"

export function useMount({
  actions: { mount, unmount },
  condition,
}: {
  actions: {
    mount: ActionCreatorWithoutPayload
    unmount: ActionCreatorWithoutPayload
  }
  condition?: boolean
}) {
  const dispatch = useAppDispatch()
  useEffect(() => {
    if (condition === false) return
    dispatch(mount())
    return () => {
      dispatch(unmount())
    }
  }, [condition, dispatch, mount, unmount])
}
