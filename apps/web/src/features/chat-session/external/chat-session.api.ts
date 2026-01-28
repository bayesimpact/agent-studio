import {
  type ChatSessionDto,
  type ChatSessionMessageDto,
  ChatSessionMessagesRoutes,
  ChatSessionsRoutes,
} from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { ChatSession, ChatSessionMessage } from "../chat-session.models"
import type { IChatSessionSpi } from "../chat-session.spi"

export default {
  createPlaygroundSession: async (chatBotId: string) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof ChatSessionsRoutes.createPlaygroundSession.response>(
      ChatSessionsRoutes.createPlaygroundSession.getPath({ chatBotId }),
    )

    return fromDto(response.data.data)
  },
  getMessages: async (sessionId: string) => {
    const axios = getAxiosInstance()
    const response = await axios.get<
      typeof ChatSessionMessagesRoutes.listMessages.response
    >(ChatSessionMessagesRoutes.listMessages.getPath({ sessionId }))

    return fromMessagesDto(response.data.data.messages)
  },
} satisfies IChatSessionSpi

const fromDto = (dto: ChatSessionDto): ChatSession => ({
  id: dto.id,
  chatbotId: dto.chatbotId,
  type: dto.type,
  expiresAt: dto.expiresAt,
})

const fromMessagesDto = (dtos: ChatSessionMessageDto[]): ChatSessionMessage[] =>
  dtos.map((message) => ({
    ...message,
  }))
