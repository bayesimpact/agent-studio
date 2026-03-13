import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { Organization } from "../organizations/organizations.models"

interface State {
  isAuthenticated: boolean
  isAdmin: boolean
  isAdminInterface: boolean
}

const initialState: State = {
  isAuthenticated: false,
  isAdmin: false,
  isAdminInterface: false,
}

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload
    },
    setIsAdmin: (state, action: PayloadAction<Organization["role"]>) => {
      const isAdmin = action.payload === "admin" || action.payload === "owner"
      state.isAdmin = isAdmin
      if (!isAdmin && state.isAdminInterface) {
        state.isAdminInterface = false
      }
    },
    setIsAdminInterface: (state, action: PayloadAction<boolean>) => {
      if (state.isAdmin) {
        state.isAdminInterface = action.payload
      } else {
        state.isAdminInterface = false
      }
    },
  },
})

export type { State as AuthState }
export const authInitialState = initialState
export const authActions = { ...slice.actions }
export const authSliceReducer = slice.reducer
