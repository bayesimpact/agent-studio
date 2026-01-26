import type { RootState } from "@/store"

export const selectProjects = (state: RootState) => state.projects.projects
export const selectCreatedProject = (state: RootState) => state.projects.createdProject
export const selectProjectsStatus = (state: RootState) => state.projects.status
export const selectProjectsError = (state: RootState) => state.projects.error

export const selectCurrentProject = (projectId?: string) => (state: RootState) =>
  state.projects.projects?.find((project) => project.id === projectId)
