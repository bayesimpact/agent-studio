import { createSelector } from "@reduxjs/toolkit"
import type { RootState } from "@/store"
import { ADS, type AsyncData } from "@/store/async-data-status"
import type { Project } from "./projects.models"

export const selectProjectsData = (state: RootState) => state.projects.data

export const selectCurrentProjectId = (state: RootState) => state.projects.currentProjectId

export const selectCurrentProjectData = createSelector(
  [selectProjectsData, selectCurrentProjectId],
  (projectsData, projectId): AsyncData<Project> => {
    if (!projectId) return { status: ADS.Error, value: null, error: "No project selected" }

    if (!ADS.isFulfilled(projectsData)) return { ...projectsData }

    const project = projectsData.value?.find((p) => p.id === projectId)

    if (!project) return { status: ADS.Error, value: null, error: "No project found" }

    return { status: ADS.Fulfilled, value: project, error: null }
  },
)

export const hasProjectChanged = (prevState: RootState, nextState: RootState): boolean => {
  const prev = selectCurrentProjectData(prevState)
  const next = selectCurrentProjectData(nextState)
  return prev.value?.id !== next.value?.id && !!next.value?.id
}
