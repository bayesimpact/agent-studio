import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

type State = {
  value: string | null
}

const initialState: State = {
  value: null,
}

const slice = createSlice({
  name: "currentAgentSessionId",
  initialState,
  reducers: {
    setCurrentAgentSessionId: (state, action: PayloadAction<{ agentSessionId: string | null }>) => {
      state.value = action.payload.agentSessionId
    },
    reset: () => initialState,
  },
})

export type { State as currentAgentSessionIdState }
export const currentAgentSessionIdInitialState = initialState
export const currentAgentSessionIdActions = { ...slice.actions }
export const currentAgentSessionIdSlice = slice
