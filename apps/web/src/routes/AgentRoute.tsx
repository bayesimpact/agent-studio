import { selectCurrentAgentData } from "@/features/agents/agents.selectors"
import { selectCurrentOrganizationId } from "@/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/features/projects/projects.selectors"
import { useAppSelector } from "@/store/hooks"
import { AsyncRoute } from "./AsyncRoute"
import { ConversationAgentRoute } from "./agents/ConversationAgentRoute"
import { ExtractionAgentRoute } from "./agents/ExtractionAgentRoute"
import { FormAgentRoute } from "./agents/FormAgentRoute"
import { ErrorRoute } from "./ErrorRoute"

export function AgentRoute() {
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)
  const agent = useAppSelector(selectCurrentAgentData)

  if (!organizationId || !projectId)
    return <ErrorRoute error={"Missing organization or project ID"} />

  return (
    <AsyncRoute data={[agent]}>
      {([agentValue]) => {
        switch (agentValue.type) {
          case "conversation":
            return (
              <ConversationAgentRoute
                projectId={projectId}
                agent={agentValue}
                organizationId={organizationId}
              />
            )
          case "form":
            return (
              <FormAgentRoute
                projectId={projectId}
                agent={agentValue}
                organizationId={organizationId}
              />
            )
          case "extraction":
            return (
              <ExtractionAgentRoute
                projectId={projectId}
                agent={agentValue}
                organizationId={organizationId}
              />
            )
          default:
            return <ErrorRoute error={"Unknown agent type"} />
        }
      }}
    </AsyncRoute>
  )
}
