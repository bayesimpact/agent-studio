import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import type { ChatBot, CreateChatBotPayload, UpdateChatBotPayload } from "./chat-bots.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listChatBots = createAsyncThunk<ChatBot[], { projectId: string }, ThunkConfig>(
  "chatBots/list",
  async ({ projectId }, { extra: { services } }) => await services.chatBots.getAll(projectId),
)

export const createChatBot = createAsyncThunk<ChatBot, CreateChatBotPayload, ThunkConfig>(
  "chatBots/create",
  async (payload, { extra: { services } }) => await services.chatBots.createOne(payload),
)

export const updateChatBot = createAsyncThunk<
  void,
  { chatBotId: string; payload: UpdateChatBotPayload },
  ThunkConfig
>(
  "chatBots/update",
  async ({ chatBotId, payload }, { extra: { services } }) =>
    await services.chatBots.updateOne(chatBotId, payload),
)

export const deleteChatBot = createAsyncThunk<void, { chatBotId: string }, ThunkConfig>(
  "chatBots/delete",
  async ({ chatBotId }, { extra: { services } }) => await services.chatBots.deleteOne(chatBotId),
)
