import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface State {
  isLoading: boolean
  isAuthenticated: boolean
  isAdminInterface: boolean
  abilities: {
    canManageOrganizations: boolean
    canManageProjects: boolean
    canReadAgent: boolean
  }
}

const initialState: State = {
  isLoading: true,
  isAuthenticated: false,
  isAdminInterface: false,
  abilities: {
    canManageOrganizations: false,
    canManageProjects: false,
    canReadAgent: false,
  },
}

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload
    },
    setAbilities: (state, action: PayloadAction<State["abilities"]>) => {
      state.abilities = action.payload
    },
    setIsStudioInterface: (state, action: PayloadAction<boolean>) => {
      if (state.abilities.canManageOrganizations || state.abilities.canManageProjects) {
        state.isAdminInterface = action.payload
      } else {
        state.isAdminInterface = false
      }
    },
    setStopLoading: (state) => {
      state.isLoading = false
    },
  },
})

export type { State as AuthState }
export const authInitialState = initialState
export const authActions = { ...slice.actions }
export const authSliceReducer = slice.reducer
