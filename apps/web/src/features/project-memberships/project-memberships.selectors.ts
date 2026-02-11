import type { RootState } from "@/store"

export const selectProjectMemberships = (state: RootState) => state.projectMemberships.data

export const selectProjectMembershipsStatus = (state: RootState) =>
  state.projectMemberships.data.status
