import type { RootState } from "@/store"

export const selectAgentMemberships = (state: RootState) => state.agentMemberships.data

export const selectAgentMembershipsStatus = (state: RootState) => state.agentMemberships.data.status
