import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface State {
  isAuthenticated: boolean
  isAdmin: boolean
}

const initialState: State = {
  isAuthenticated: false,
  isAdmin: false,
}

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload
    },
    setIsAdmin: (state, action: PayloadAction<boolean>) => {
      state.isAdmin = action.payload
    },
  },
})

export type { State as AuthState }
export const authInitialState = initialState
export const authActions = { ...slice.actions }
export const authSliceReducer = slice.reducer
