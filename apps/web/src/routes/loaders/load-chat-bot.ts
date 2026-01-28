import type { Params } from "react-router-dom"
import type { ChatBot } from "@/features/chat-bots/chat-bots.models"
import { chatBotsActions } from "@/features/chat-bots/chat-bots.slice"
import { listChatBots } from "@/features/chat-bots/chat-bots.thunks"
import { projectsActions } from "@/features/projects/projects.slice"
import type { AppDispatch } from "@/store"

export type ChatBotLoaderData = ChatBot | null

export const loadChatBot = async ({
  dispatch,
  params,
}: {
  dispatch: AppDispatch
  params: Params<string>
}): Promise<ChatBotLoaderData> => {
  const { projectId, chatBotId } = params
  if (!projectId || !chatBotId) {
    if (!projectId) dispatch(projectsActions.setCurrentProjectId({ projectId: null }))

    dispatch(chatBotsActions.setCurrentChatBotId({ chatBotId: null }))
    return null
  }

  dispatch(projectsActions.setCurrentProjectId({ projectId }))
  dispatch(chatBotsActions.setCurrentChatBotId({ chatBotId }))

  try {
    const chatBots = await dispatch(listChatBots({ projectId })).unwrap()
    const chatBot = chatBots.find((chatBot) => chatBot.id === chatBotId)

    if (chatBot) return chatBot
    return null
  } catch (error) {
    throw new Error("Failed to load chat bot", error as Error)
  }
}
