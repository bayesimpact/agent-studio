import type { RootState } from "@/common/store/types"
import { selectCurrentAgentSessionId } from "./agents/agent-sessions/current-agent-session-id/current-agent-session-id.selectors"
import { selectCurrentAgentId } from "./agents/agents.selectors"
import { selectCurrentOrganizationId } from "./organizations/organizations.selectors"
import { selectCurrentProjectId } from "./projects/projects.selectors"

type IdKey = "organizationId" | "projectId" | "agentId" | "agentSessionId"
type GetIdsResult<T extends readonly IdKey[]> = {
  [K in T[number]]: string
}

export const getCurrentIds = <T extends readonly IdKey[]>({
  state,
  wantedIds, // TODO: remove this and always return all ids
}: {
  state: RootState
  wantedIds: T
}): GetIdsResult<T> => {
  const result: Partial<Record<T[number], string>> = {}
  const idLookups = {
    organizationId: {
      label: "Organization",
      select: selectCurrentOrganizationId,
    },
    projectId: {
      label: "Project",
      select: selectCurrentProjectId,
    },
    agentId: {
      label: "Agent",
      select: selectCurrentAgentId,
    },
    agentSessionId: {
      label: "Agent Session",
      select: selectCurrentAgentSessionId,
    },
  } as const

  for (const idKey of wantedIds) {
    const { label, select } = idLookups[idKey]
    const value = select(state)
    if (!value) {
      throw new Error(`No current ${label} ID found.`)
    }
    result[idKey as keyof typeof result] = value
  }

  return result as GetIdsResult<T>
}
