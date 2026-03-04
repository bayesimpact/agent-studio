import type { RootState } from "@/store"

export const selectCurrentAgentSessionId = (state: RootState) => state.currentAgentSessionId.value
