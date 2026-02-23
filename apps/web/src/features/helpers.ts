import type { RootState } from "@/store/types"
import { selectCurrentAgentSessionId } from "./agent-sessions/agent-sessions.selectors"
import { selectCurrentAgentId } from "./agents/agents.selectors"
import { selectCurrentOrganizationId } from "./organizations/organizations.selectors"
import { selectCurrentProjectId } from "./projects/projects.selectors"

type GetIdsResult<
  T extends readonly ("organizationId" | "projectId" | "agentId" | "agentSessionId")[],
> = {
  [K in T[number]]: string
}

export const getCurrentIds = <
  T extends readonly ("organizationId" | "projectId" | "agentId" | "agentSessionId")[],
>({
  state,
  wantedIds,
}: {
  state: RootState
  wantedIds: T
}): GetIdsResult<T> => {
  const result: Partial<{
    organizationId: string
    projectId: string
    agentId: string
    agentSessionId: string
  }> = {}
  if (wantedIds.includes("organizationId")) {
    const organizationId = selectCurrentOrganizationId(state)
    if (!organizationId) {
      throw new Error("No current Organization ID.")
    }
    result.organizationId = organizationId
  }
  if (wantedIds.includes("projectId")) {
    const projectId = selectCurrentProjectId(state)
    if (!projectId) {
      throw new Error("No current Project ID.")
    }
    result.projectId = projectId
  }
  if (wantedIds.includes("agentId")) {
    const agentId = selectCurrentAgentId(state)
    if (!agentId) {
      throw new Error("No current Agent ID.")
    }
    result.agentId = agentId
  }
  if (wantedIds.includes("agentSessionId")) {
    const agentSessionId = selectCurrentAgentSessionId(state)
    if (!agentSessionId) {
      throw new Error("No current Agent Session ID.")
    }
    result.agentSessionId = agentSessionId
  }
  return result as GetIdsResult<T>
}
