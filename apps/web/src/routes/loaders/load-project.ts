import type { ChatBotDto, ProjectDto } from "@caseai-connect/api-contracts"
import type { Params } from "react-router-dom"
import { listChatBots } from "@/features/chat-bots/chat-bots.thunks"
import { listProjects } from "@/features/projects/projects.thunks"
import type { AppDispatch } from "@/store"

export type ProjectAndChatBotsLoaderData = { project: ProjectDto; chatBots: ChatBotDto[] } | null

export const loadProjectAndChatBots = async ({
  dispatch,
  params,
}: {
  dispatch: AppDispatch
  params: Params<string>
}): Promise<ProjectAndChatBotsLoaderData> => {
  const { organizationId, projectId } = params
  if (!organizationId || !projectId) return null

  const {
    data: { projects },
  } = await dispatch(listProjects(organizationId)).unwrap()
  const project = projects.find((p) => p.id === projectId)

  if (!project) return null

  const {
    data: { chatBots },
  } = await dispatch(listChatBots(project.id)).unwrap()

  return { project, chatBots }
}
