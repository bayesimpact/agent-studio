import type { Params } from "react-router-dom"
import type { ChatBot } from "@/features/chat-bots/chat-bots.models"
import { listChatBots } from "@/features/chat-bots/chat-bots.thunks"
import { organizationsActions } from "@/features/organizations/organizations.slice"
import type { Project } from "@/features/projects/projects.models"
import { projectsActions } from "@/features/projects/projects.slice"
import { listProjects } from "@/features/projects/projects.thunks"
import type { AppDispatch } from "@/store"

export type ProjectAndChatBotsLoaderData = { project: Project; chatBots: ChatBot[] } | null

export const loadProjectAndChatBots = async ({
  dispatch,
  params,
}: {
  dispatch: AppDispatch
  params: Params<string>
}): Promise<ProjectAndChatBotsLoaderData> => {
  const { organizationId, projectId } = params
  if (!organizationId || !projectId) {
    if (!organizationId)
      dispatch(organizationsActions.setCurrentOrganizationId({ organizationId: null }))

    dispatch(projectsActions.setCurrentProjectId({ projectId: null }))
    return null
  }

  dispatch(organizationsActions.setCurrentOrganizationId({ organizationId }))
  dispatch(projectsActions.setCurrentProjectId({ projectId }))

  try {
    const projects = await dispatch(listProjects({ organizationId })).unwrap() // TODO: get it from store
    const project = projects.find((project) => project.id === projectId)

    if (!project) return null

    const chatBots = await dispatch(listChatBots({ projectId: project.id })).unwrap()

    return { project, chatBots }
  } catch (error) {
    throw new Error("Failed to load project and chat bots", error as Error)
  }
}
