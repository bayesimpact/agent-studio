import type { RootState } from "@/store"

export const selectMe = (state: RootState) => state.me.user
export const selectMeStatus = (state: RootState) => state.me.status
export const selectMeError = (state: RootState) => state.me.error
