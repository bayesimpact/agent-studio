import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import type { ChatSession, ChatSessionMessage } from "./chat-session.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const createPlaygroundSession = createAsyncThunk<ChatSession, string, ThunkConfig>(
  "chatSession/createPlaygroundSession",
  async (chatBotId, { extra: { services } }) => {
    return services.chatSession.createPlaygroundSession(chatBotId)
  },
)

export const loadSessionMessages = createAsyncThunk<
  ChatSessionMessage[],
  string,
  ThunkConfig
>("chatSession/loadSessionMessages", async (sessionId, { extra: { services } }) => {
  return services.chatSession.getMessages(sessionId)
})
