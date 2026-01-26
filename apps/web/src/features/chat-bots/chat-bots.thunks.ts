import type {
  CreateChatBotRequestDto,
  UpdateChatBotRequestDto,
} from "@caseai-connect/api-contracts"
import { createAsyncThunk } from "@reduxjs/toolkit"
import type { Services } from "@/di/services"
import type { RootState, ThunkExtraArg } from "@/store"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listChatBots = createAsyncThunk<
  { data: Awaited<ReturnType<Services["chatBots"]["listChatBots"]>> },
  string,
  ThunkConfig
>("chatBots/list", async (projectId, { extra }) => {
  const data = await extra.services.chatBots.listChatBots(projectId)
  return { data }
})

export const createChatBot = createAsyncThunk<
  { data: Awaited<ReturnType<Services["chatBots"]["createChatBot"]>> },
  CreateChatBotRequestDto,
  ThunkConfig
>("chatBots/create", async (payload, { extra }) => {
  const data = await extra.services.chatBots.createChatBot(payload)
  return { data }
})

export const updateChatBot = createAsyncThunk<
  void,
  { chatBotId: string; payload: UpdateChatBotRequestDto },
  ThunkConfig
>("chatBots/update", async ({ chatBotId, payload }, { extra }) => {
  await extra.services.chatBots.updateChatBot(chatBotId, payload)
})

export const deleteChatBot = createAsyncThunk<string, string, ThunkConfig>(
  "chatBots/delete",
  async (chatBotId, { extra }) => {
    await extra.services.chatBots.deleteChatBot(chatBotId)
    return chatBotId
  },
)
