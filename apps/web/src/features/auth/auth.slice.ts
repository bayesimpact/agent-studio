import { createSlice } from "@reduxjs/toolkit"

interface AuthState {
  isAuthenticated: boolean
  status: "idle" | "loading" | "succeeded" | "failed"
}

const initialState: AuthState = {
  isAuthenticated: false,
  status: "idle",
}

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthenticated: (state, action: { payload: boolean }) => {
      state.isAuthenticated = action.payload
    },
    clearAuth: (state) => {
      state.isAuthenticated = false
    },
  },
})

export const { setAuthenticated, clearAuth } = authSlice.actions
