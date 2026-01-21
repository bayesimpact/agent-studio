import {
  ChatBotsRoutes,
  type CreateChatBotRequestDto,
  type UpdateChatBotRequestDto,
} from "@caseai-connect/api-contracts"
import { createAsyncThunk } from "@reduxjs/toolkit"
import { selectAuthToken } from "@/features/auth/auth.selectors"
import type { RootState } from "@/store"
import { apiRequest } from "@/store/apiClient"

export const listChatBots = createAsyncThunk(
  "chatBots/list",
  async (projectId: string, { getState }) => {
    const state = getState() as RootState
    const token = selectAuthToken(state)
    if (!token) {
      throw new Error("No authentication token available")
    }
    return apiRequest(ChatBotsRoutes.listChatBots, undefined, token, { projectId })
  },
)

export const createChatBot = createAsyncThunk(
  "chatBots/create",
  async (payload: CreateChatBotRequestDto, { getState }) => {
    const state = getState() as RootState
    const token = selectAuthToken(state)
    if (!token) {
      throw new Error("No authentication token available")
    }
    return apiRequest(ChatBotsRoutes.createChatBot, { payload }, token)
  },
)

export const updateChatBot = createAsyncThunk(
  "chatBots/update",
  async (
    { chatBotId, payload }: { chatBotId: string; payload: UpdateChatBotRequestDto },
    { getState },
  ) => {
    const state = getState() as RootState
    const token = selectAuthToken(state)
    if (!token) {
      throw new Error("No authentication token available")
    }
    return apiRequest(ChatBotsRoutes.updateChatBot, { payload }, token, {
      chatBotId,
    })
  },
)

export const deleteChatBot = createAsyncThunk(
  "chatBots/delete",
  async (chatBotId: string, { getState }) => {
    const state = getState() as RootState
    const token = selectAuthToken(state)
    if (!token) {
      throw new Error("No authentication token available")
    }
    return apiRequest(ChatBotsRoutes.deleteChatBot, undefined, token, {
      chatBotId,
    })
  },
)
