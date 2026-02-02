import {
  type ChatSessionDto,
  type ChatSessionMessageDto,
  ChatSessionMessagesRoutes,
  ChatSessionsRoutes,
} from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { ChatSession, ChatSessionMessage } from "../chat-sessions.models"
import type { IChatSessionsSpi } from "../chat-sessions.spi"

export default {
  getAllPlayground: async (chatBotId: string) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof ChatSessionsRoutes.getAllPlayground.response>(
      ChatSessionsRoutes.getAllPlayground.getPath({ chatBotId }),
    )
    return response.data.data.map(fromDto)
  },
  getAllApp: async (chatBotId: string) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof ChatSessionsRoutes.getAllApp.response>(
      ChatSessionsRoutes.getAllApp.getPath({ chatBotId }),
    )
    return response.data.data.map(fromDto)
  },
  createPlaygroundSession: async (chatBotId: string) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof ChatSessionsRoutes.createPlaygroundSession.response>(
      ChatSessionsRoutes.createPlaygroundSession.getPath({ chatBotId }),
    )

    return fromDto(response.data.data)
  },
  createAppSession: async ({ chatBotId, chatSessionType }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof ChatSessionsRoutes.createAppSession.response>(
      ChatSessionsRoutes.createAppSession.getPath({ chatBotId }),
      {
        payload: { chatSessionType },
      } satisfies typeof ChatSessionsRoutes.createAppSession.request,
    )
    return fromDto(response.data.data)
  },
  getMessages: async (sessionId: string) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof ChatSessionMessagesRoutes.listMessages.response>(
      ChatSessionMessagesRoutes.listMessages.getPath({ sessionId }),
    )

    return fromMessagesDto(response.data.data.messages)
  },
} satisfies IChatSessionsSpi

const fromDto = (dto: ChatSessionDto): ChatSession => ({
  id: dto.id,
  chatBotId: dto.chatBotId,
  type: dto.type,
  createdAt: dto.createdAt,
  updatedAt: dto.updatedAt,
})

const fromMessagesDto = (dtos: ChatSessionMessageDto[]): ChatSessionMessage[] =>
  dtos.map((message) => ({
    ...message,
  }))
