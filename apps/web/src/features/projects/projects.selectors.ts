import type { RootState } from "@/store"

export const selectProjects = (state: RootState) => state.projects.data.value

export const selectProjectsData = (state: RootState) => state.projects.data

export const selectProjectsStatus = (state: RootState) => state.projects.data.status

export const selectProjectsError = (state: RootState) => state.projects.data.error

export const selectCurrentProjectId = (state: RootState) => state.projects.currentProjectId

export const selectCurrentProject = (state: RootState) =>
  state.projects.data.value?.find((project) => project.id === selectCurrentProjectId(state))
