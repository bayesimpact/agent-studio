import type { RootState } from "@/store"

export const selectMe = (state: RootState) => state.me.data
export const selectMeStatus = (state: RootState) => state.me.data.status
export const selectMeError = (state: RootState) => state.me.data.error
export const selectIsBayesMember = (state: RootState): boolean =>
  !!state.me.data?.value?.email.endsWith("@bayesimpact.org")
