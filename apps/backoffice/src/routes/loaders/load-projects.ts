import type { ProjectDto } from "@caseai-connect/api-contracts"
import type { Params } from "react-router-dom"
import { listProjects } from "@/features/projects/projects.thunks"
import type { AppDispatch } from "@/store"

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

  return projects
}
