import type { RootState } from "@/store"

export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated
export const selectAbilities = (state: RootState) => state.auth.abilities
