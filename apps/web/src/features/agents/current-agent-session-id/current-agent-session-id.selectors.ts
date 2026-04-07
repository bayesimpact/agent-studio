import type { RootState } from "@/common/store"

export const selectCurrentAgentSessionId = (state: RootState) => state.currentAgentSessionId.value

export const hasAgentSessionChanged = (originalState: RootState, currentState: RootState) => {
  const prevId = selectCurrentAgentSessionId(originalState)
  const nextId = selectCurrentAgentSessionId(currentState)
  return prevId !== nextId && !!nextId
}
