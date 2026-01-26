import type { ProjectDto } from "@caseai-connect/api-contracts"
import type { Params } from "react-router-dom"
import { listProjects } from "@/features/projects/projects.thunks"
import type { AppDispatch } from "@/store"
import { loadProjectAndChatBots } from "./load-project"

export type ProjectsLoaderData = ProjectDto[] | null

export const loadProjects = async ({
  dispatch,
  params,
}: {
  dispatch: AppDispatch
  params: Params<string>
}): Promise<ProjectsLoaderData> => {
  const { organizationId } = params
  if (!organizationId) return null

  const {
    data: { projects },
  } = await dispatch(listProjects(organizationId)).unwrap()

  // Automatically load the only project if there's just one
  if (projects.length === 1)
    loadProjectAndChatBots({ dispatch, params: { ...params, projectId: projects[0]!.id } })

  return projects
}
