import {
  ChatBotsRoutes,
  type CreateChatBotRequestDto,
  type UpdateChatBotRequestDto,
} from "@caseai-connect/api-contracts"
import { createAsyncThunk } from "@reduxjs/toolkit"
import { apiRequestWithAuth } from "@/services/apiClientWithAuth"

export const listChatBots = createAsyncThunk("chatBots/list", async (projectId: string) => {
  return apiRequestWithAuth({
    route: ChatBotsRoutes.listChatBots,
    pathParams: { projectId },
  })
})

export const createChatBot = createAsyncThunk(
  "chatBots/create",
  async (payload: CreateChatBotRequestDto) => {
    return apiRequestWithAuth({
      route: ChatBotsRoutes.createChatBot,
      payload: { payload },
    })
  },
)

export const updateChatBot = createAsyncThunk(
  "chatBots/update",
  async ({ chatBotId, payload }: { chatBotId: string; payload: UpdateChatBotRequestDto }) => {
    return apiRequestWithAuth({
      route: ChatBotsRoutes.updateChatBot,
      payload: { payload },
      pathParams: { chatBotId },
    })
  },
)

export const deleteChatBot = createAsyncThunk("chatBots/delete", async (chatBotId: string) => {
  return apiRequestWithAuth({
    route: ChatBotsRoutes.deleteChatBot,
    pathParams: {
      chatBotId,
    },
  })
})
