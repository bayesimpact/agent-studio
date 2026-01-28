import type { Params } from "react-router-dom"
import { organizationsActions } from "@/features/organizations/organizations.slice"
import type { Project } from "@/features/projects/projects.models"
import { listProjects } from "@/features/projects/projects.thunks"
import type { AppDispatch } from "@/store"
import { loadProjectAndChatBots } from "./load-project"

export type ProjectsLoaderData = Project[] | null

export const loadProjects = async ({
  dispatch,
  params,
}: {
  dispatch: AppDispatch
  params: Params<string>
}): Promise<ProjectsLoaderData> => {
  const { organizationId } = params
  if (!organizationId) {
    dispatch(organizationsActions.setCurrentOrganizationId({ organizationId: null }))
    return null
  }

  dispatch(organizationsActions.setCurrentOrganizationId({ organizationId }))

  try {
    const projects = await dispatch(listProjects({ organizationId })).unwrap()

    // Automatically load the only project if there's just one
    if (projects.length === 1)
      loadProjectAndChatBots({ dispatch, params: { ...params, projectId: projects[0]!.id } })

    return projects
  } catch (error) {
    throw new Error("Failed to load projects", error as Error)
  }
}
