import type { RootState } from "@/store"

export const selectAgentMemberships = (state: RootState) => state.studio.agentMemberships.data

export const selectAgentMembershipsStatus = (state: RootState) =>
  state.studio.agentMemberships.data.status
