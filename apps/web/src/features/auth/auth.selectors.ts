import type { RootState } from "@/store"

export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated
export const selectAbilities = (state: RootState) => state.auth.abilities
export const selectIsAdminInterface = (state: RootState) => state.auth.isAdminInterface

export const hasInterfaceChanged = (prevState: RootState, nextState: RootState): boolean =>
  selectIsAdminInterface(prevState) !== selectIsAdminInterface(nextState)
