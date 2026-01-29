import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import type { ChatBot } from "./chat-bots.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listChatBots = createAsyncThunk<ChatBot[], { projectId: string }, ThunkConfig>(
  "chatBots/list",
  async (params, { extra: { services } }) => await services.chatBots.getAll(params),
)

export const createChatBot = createAsyncThunk<
  void,
  Pick<ChatBot, "name" | "defaultPrompt" | "projectId">,
  ThunkConfig
>(
  "chatBots/create",
  async (payload, { extra: { services } }) =>
    await services.chatBots.createOne(
      { projectId: payload.projectId },
      {
        name: payload.name,
        defaultPrompt: payload.defaultPrompt,
      },
    ),
)

export const updateChatBot = createAsyncThunk<
  void,
  {
    chatBotId: string
    projectId: string
    fields: Partial<Pick<ChatBot, "name" | "defaultPrompt">>
  },
  ThunkConfig
>(
  "chatBots/update",
  async ({ chatBotId, projectId, fields }, { extra: { services } }) =>
    await services.chatBots.updateOne({ chatBotId, projectId }, fields),
)

export const deleteChatBot = createAsyncThunk<
  void,
  { chatBotId: string; projectId: string },
  ThunkConfig
>(
  "chatBots/delete",
  async ({ chatBotId, projectId }, { extra: { services } }) =>
    await services.chatBots.deleteOne({ chatBotId, projectId }),
)
