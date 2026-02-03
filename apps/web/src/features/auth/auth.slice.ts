import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

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
    setIsAdmin: (state, action: PayloadAction<boolean>) => {
      const isAdmin = action.payload
      state.isAdmin = action.payload
      if (!isAdmin && state.isAdminInterface) {
        state.isAdminInterface = false
      }
    },
    setIsAdminInterface: (state, action: PayloadAction<boolean>) => {
      state.isAdminInterface = action.payload
    },
  },
})

export type { State as AuthState }
export const authInitialState = initialState
export const authActions = { ...slice.actions }
export const authSliceReducer = slice.reducer
