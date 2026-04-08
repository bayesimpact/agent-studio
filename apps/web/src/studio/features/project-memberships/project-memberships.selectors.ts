import type { RootState } from "@/common/store"

export const selectProjectMemberships = (state: RootState) => state.studio.projectMemberships.data

export const selectProjectMembershipsStatus = (state: RootState) =>
  state.studio.projectMemberships.data.status
