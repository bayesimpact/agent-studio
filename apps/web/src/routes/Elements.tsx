import { AgentRoute } from "./AgentRoute"
import { ConversationAgentSessionRoute } from "./ConversationAgentSessionRoute"
import { DashboardRoute } from "./DashboardRoute"
import { RouteNames } from "./helpers"
import { ProjectRoute } from "./ProjectRoute"
import { ProtectedRoute } from "./ProtectedRoute"

export const getElement = (routeNames: RouteNames) => {
  switch (routeNames) {
    case RouteNames.ORGANIZATION_DASHBOARD:
      return (
        <ProtectedRoute>
          <DashboardRoute />
        </ProtectedRoute>
      )

    case RouteNames.PROJECT:
      return <ProjectRoute />

    case RouteNames.AGENT:
      return <AgentRoute />

    case RouteNames.AGENT_SESSION:
      return <ConversationAgentSessionRoute />

    default:
      break
  }
}
