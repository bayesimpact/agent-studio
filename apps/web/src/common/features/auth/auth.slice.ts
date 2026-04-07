import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface State {
  isLoading: boolean
  isAuthenticated: boolean
  abilities: {
    canAccessStudio: boolean
    canReadAgent: boolean
  }
}

const initialState: State = {
  isLoading: true,
  isAuthenticated: false,
  abilities: {
    canAccessStudio: false,
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
    setStopLoading: (state) => {
      state.isLoading = false
    },
  },
})

export type { State as AuthState }
export const authInitialState = initialState
export const authActions = { ...slice.actions }
export const authSlice = slice
