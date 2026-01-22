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
    return apiRequest({ route: ChatBotsRoutes.listChatBots, token, pathParams: { projectId } })
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
    return apiRequest({ route: ChatBotsRoutes.createChatBot, payload: { payload }, token })
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
    return apiRequest({
      route: ChatBotsRoutes.updateChatBot,
      payload: { payload },
      token,
      pathParams: { chatBotId },
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
    return apiRequest({
      route: ChatBotsRoutes.deleteChatBot,
      token,
      pathParams: {
        chatBotId,
      },
    })
  },
)
