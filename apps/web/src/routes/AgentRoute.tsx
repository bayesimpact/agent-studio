import { selectCurrentAgentData } from "@/features/agents/agents.selectors"
import { selectCurrentOrganizationId } from "@/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/features/projects/projects.selectors"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { ConversationAgentRoute } from "./agents/ConversationAgentRoute"
import { ExtractionAgentRoute } from "./agents/ExtractionAgentRoute"
import { ErrorRoute } from "./ErrorRoute"
import { LoadingRoute } from "./LoadingRoute"

export function AgentRoute() {
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)
  const agent = useAppSelector(selectCurrentAgentData)

  if (ADS.isError(agent) || !organizationId || !projectId)
    return <ErrorRoute error={agent.error || "Unknown error"} />

  if (ADS.isFulfilled(agent)) {
    switch (agent.value.type) {
      case "conversation":
        return (
          <ConversationAgentRoute
            projectId={projectId}
            agent={agent.value}
            organizationId={organizationId}
          />
        )
      case "extraction":
        return (
          <ExtractionAgentRoute
            projectId={projectId}
            agent={agent.value}
            organizationId={organizationId}
          />
        )
      default:
        return <ErrorRoute error={"Unknown agent type"} />
    }
  }

  return <LoadingRoute />
}
