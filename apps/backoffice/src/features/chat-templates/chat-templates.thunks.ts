import {
  ChatTemplatesRoutes,
  type CreateChatTemplateRequestDto,
  type UpdateChatTemplateRequestDto,
} from "@caseai-connect/api-contracts"
import { createAsyncThunk } from "@reduxjs/toolkit"
import { selectAuthToken } from "@/features/auth/auth.selectors"
import type { RootState } from "@/store"
import { apiRequest } from "@/store/apiClient"

export const listChatTemplates = createAsyncThunk(
  "chatTemplates/list",
  async (projectId: string, { getState }) => {
    const state = getState() as RootState
    const token = selectAuthToken(state)
    if (!token) {
      throw new Error("No authentication token available")
    }
    return apiRequest(ChatTemplatesRoutes.listChatTemplates, undefined, token, { projectId })
  },
)

export const createChatTemplate = createAsyncThunk(
  "chatTemplates/create",
  async (payload: CreateChatTemplateRequestDto, { getState }) => {
    const state = getState() as RootState
    const token = selectAuthToken(state)
    if (!token) {
      throw new Error("No authentication token available")
    }
    return apiRequest(ChatTemplatesRoutes.createChatTemplate, { payload }, token)
  },
)

export const updateChatTemplate = createAsyncThunk(
  "chatTemplates/update",
  async (
    { chatTemplateId, payload }: { chatTemplateId: string; payload: UpdateChatTemplateRequestDto },
    { getState },
  ) => {
    const state = getState() as RootState
    const token = selectAuthToken(state)
    if (!token) {
      throw new Error("No authentication token available")
    }
    return apiRequest(ChatTemplatesRoutes.updateChatTemplate, { payload }, token, {
      chatTemplateId,
    })
  },
)

export const deleteChatTemplate = createAsyncThunk(
  "chatTemplates/delete",
  async (chatTemplateId: string, { getState }) => {
    const state = getState() as RootState
    const token = selectAuthToken(state)
    if (!token) {
      throw new Error("No authentication token available")
    }
    return apiRequest(ChatTemplatesRoutes.deleteChatTemplate, undefined, token, {
      chatTemplateId,
    })
  },
)
