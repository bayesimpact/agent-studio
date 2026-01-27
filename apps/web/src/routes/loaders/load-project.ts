import type { Params } from "react-router-dom"
import { listChatBots } from "@/features/chat-bots/chat-bots.thunks"
import type { Project } from "@/features/projects/projects.models"
import { listProjects } from "@/features/projects/projects.thunks"
import type { AppDispatch } from "@/store"

export type ProjectAndChatBotsLoaderData = { project: Project; chatBots: unknown[] } | null

export const loadProjectAndChatBots = async ({
  dispatch,
  params,
}: {
  dispatch: AppDispatch
  params: Params<string>
}): Promise<ProjectAndChatBotsLoaderData> => {
  const { organizationId, projectId } = params
  if (!organizationId || !projectId) return null

  try {
    const projects = await dispatch(listProjects(organizationId)).unwrap()
    const project = projects.find((project) => project.id === projectId)

    if (!project) return null

    const { data } = await dispatch(listChatBots(project.id)).unwrap()

    return { project, chatBots: data.chatBots }
  } catch (error) {
    throw new Error("Failed to load project and chat bots", error as Error)
  }
}
