import { createSelector } from "@reduxjs/toolkit"
import type { RootState } from "@/store"
import { ADS, type AsyncData } from "@/store/async-data-status"
import { selectCurrentProjectId } from "../projects/projects.selectors"
import type { Resource } from "./resources.models"

export const selectResourcesStatus = (state: RootState) => state.resources.data.status

export const selectResourcesError = (state: RootState) => state.resources.data.error

export const selectResourcesData = (state: RootState) => state.resources.data

const missingProjectId = { status: ADS.Error, value: null, error: "No project selected" }
const missingResources = { status: ADS.Error, value: null, error: "No resources available" }

export const selectResourcesFromProjectId = (projectId?: string | null) =>
  createSelector([selectResourcesData], (resourcesData): AsyncData<Resource[]> => {
    if (!projectId) return missingProjectId

    if (!ADS.isFulfilled(resourcesData)) return { ...resourcesData }

    if (!resourcesData.value?.[projectId]) return missingResources

    return { status: ADS.Fulfilled, value: resourcesData.value[projectId], error: null }
  })

export const selectCurrentResourceId = (state: RootState) => state.resources.currentResourceId

export const selectCurrentResourcesData = createSelector(
  [selectCurrentProjectId, selectResourcesData],
  (projectId, resourcesData): AsyncData<Resource[]> => {
    if (!projectId) return missingProjectId

    if (!ADS.isFulfilled(resourcesData)) return { ...resourcesData }

    if (!resourcesData.value?.[projectId]) return missingResources

    return { status: ADS.Fulfilled, value: resourcesData.value[projectId], error: null }
  },
)

export const selectResourceData = createSelector(
  [selectCurrentResourcesData, selectCurrentResourceId],
  (resourcesData, resourceId): AsyncData<Resource> => {
    if (!resourceId) return { status: ADS.Error, value: null, error: "No resource selected" }
    if (!ADS.isFulfilled(resourcesData)) return { ...resourcesData }
    const resource = resourcesData.value.find((r) => r.id === resourceId)
    if (!resource)
      return { status: ADS.Error, value: null, error: "Resource not found in current project" }
    return { status: ADS.Fulfilled, value: resource, error: null }
  },
)
