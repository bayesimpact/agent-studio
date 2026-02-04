import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/store/async-data-status"
import { initOrganization } from "../global.thunks"
import type { Project } from "../projects/projects.models"
import type { ChatBot } from "./chat-bots.models"
import { listChatBots } from "./chat-bots.thunks"

type DataType = Record<Project["id"], ChatBot[]> // keyed by projectId
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
      state.currentChatBotId = action.payload.chatBotId
    },
    clearChatBots: (state, action: PayloadAction<{ projectId: string }>) => {
      // Clear chat bots for a specific project
      delete state.data.value?.[action.payload.projectId]
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initOrganization.pending, (state) => {
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(initOrganization.fulfilled, (state, action) => {
        state.data = {
          status: ADS.Fulfilled,
          error: null,
          value: action.payload.projects.reduce((acc, project) => {
            acc[project.id] = action.payload.chatBots[project.id] || []
            return acc
          }, {} as DataType),
        }
      })
      .addCase(initOrganization.rejected, (state, action) => {
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to list chat bots"
      })

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
  },
})

export type { State as ChatBotsState }
export const chatBotsInitialState = initialState
export const chatBotsActions = { ...slice.actions }
export const chatBotsSliceReducer = slice.reducer
