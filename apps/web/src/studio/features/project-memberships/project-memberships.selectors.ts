import type { RootState } from "@/store"

export const selectProjectMemberships = (state: RootState) => state.studio.projectMemberships.data

export const selectProjectMembershipsStatus = (state: RootState) =>
  state.studio.projectMemberships.data.status
