import type { RootState } from "@/store"

export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated
export const selectAuthStatus = (state: RootState) => state.auth.status
