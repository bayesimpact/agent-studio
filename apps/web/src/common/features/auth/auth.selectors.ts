import type { RootState } from "@/common/store"

export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated
