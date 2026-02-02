import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/store/async-data-status"
import { projectsActions } from "../projects/projects.slice"
import type { ChatBot } from "./chat-bots.models"
import { listChatBots } from "./chat-bots.thunks"

type DataType = Record<string, ChatBot[]> // keyed by projectId
interface State {
  currentChatBotId: string | null
  data: AsyncData<DataType>
}

const initialState: State = {
  currentChatBotId: null,
  data: defaultAsyncData,
}

const slice = createSlice({
  name: "chatBots",
  initialState,
  reducers: {
    setCurrentChatBotId: (state, action: PayloadAction<{ chatBotId: string | null }>) => {
      if (!ADS.isFulfilled(state.data)) return
      const found = Object.values(state.data.value)
        .flat()
        .find((b) => b.id === action.payload.chatBotId)
      if (!found) return

      state.currentChatBotId = action.payload.chatBotId
    },
    clearChatBots: (state, action: PayloadAction<{ projectId: string }>) => {
      // Clear chat bots for a specific project
      delete state.data.value?.[action.payload.projectId]
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listChatBots.pending, (state) => {
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(listChatBots.fulfilled, (state, action) => {
        const projectId = action.meta.arg.projectId
        state.data = {
          status: ADS.Fulfilled,
          error: null,
          value: {
            ...state.data.value,
            [projectId]: action.payload,
          },
        }
      })
      .addCase(listChatBots.rejected, (state, action) => {
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to list chat bots"
      })

    builder.addCase(projectsActions.setCurrentProjectId, (state, action) => {
      const projectId = action.payload.projectId

      if (projectId && ADS.isFulfilled(state.data) && state.data.value[projectId])
        state.data.status = ADS.Fulfilled
      else state.data.status = ADS.Uninitialized

      state.data.error = null
    })
  },
})

export type { State as ChatBotsState }
export const chatBotsInitialState = initialState
export const chatBotsActions = { ...slice.actions }
export const chatBotsSliceReducer = slice.reducer
