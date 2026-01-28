import { createSlice } from "@reduxjs/toolkit"

interface State {
  isAuthenticated: boolean
}

const initialState: State = {
  isAuthenticated: false,
}

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthenticated: (state, action: { payload: boolean }) => {
      state.isAuthenticated = action.payload
    },
  },
})

export type { State as AuthState }
export const authInitialState = initialState
export const authActions = { ...slice.actions }
export const authSliceReducer = slice.reducer
