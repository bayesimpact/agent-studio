import type { RootState } from "@/store"

export const selectProjects = (state: RootState) => state.projects.projects

export const selectProjectsStatus = (state: RootState) => state.projects.status

export const selectProjectsError = (state: RootState) => state.projects.error

export const selectCurrentProjectId = (state: RootState) => state.projects.currentProjectId

export const selectCurrentProject = (state: RootState) =>
  state.projects.projects.find((project) => project.id === selectCurrentProjectId(state))
