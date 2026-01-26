import type { ChatBotDto } from "@caseai-connect/api-contracts"
import type { Params } from "react-router-dom"
import { listChatBots } from "@/features/chat-bots/chat-bots.thunks"
import type { AppDispatch } from "@/store"

export type ChatBotLoaderData = ChatBotDto | null

export const loadChatBot = async ({
  dispatch,
  params,
}: {
  dispatch: AppDispatch
  params: Params<string>
}): Promise<ChatBotLoaderData> => {
  const { projectId, chatBotId } = params
  if (!projectId || !chatBotId) return null

  try {
    const {
      data: { chatBots },
    } = await dispatch(listChatBots(projectId)).unwrap()
    const chatBot = chatBots.find((cb) => cb.id === chatBotId)

    if (chatBot) return chatBot
    return null
  } catch (error) {
    throw new Error("Failed to load chat bot", error as Error)
  }
}
