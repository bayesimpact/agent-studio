import type { RootState } from "@/store"

export const selectMe = (state: RootState) => state.me.data
export const selectMeStatus = (state: RootState) => state.me.data.status
export const selectMeError = (state: RootState) => state.me.data.error

export const selectIsPremiumMember = (state: RootState): boolean => {
  const email = import.meta.env.VITE_PREMIUM_EMAIL as string | undefined
  if (!email) return false
  return !!state.me.data?.value?.email.endsWith(email)
}
