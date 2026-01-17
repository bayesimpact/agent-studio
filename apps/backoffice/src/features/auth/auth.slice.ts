import { createSlice } from "@reduxjs/toolkit"

interface AuthState {
  token: string | null
  status: "idle" | "loading" | "succeeded" | "failed"
}

const initialState: AuthState = {
  token: null,
  status: "idle",
}

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken: (state, action: { payload: string | null }) => {
      state.token = action.payload
    },
    clearToken: (state) => {
      state.token = null
    },
  },
})

export const { setToken, clearToken } = authSlice.actions
