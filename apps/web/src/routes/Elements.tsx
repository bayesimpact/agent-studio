import { AgentRoute } from "./AgentRoute"
import { AgentSessionRoute } from "./AgentSessionRoute"
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
      return <AgentSessionRoute />

    default:
      break
  }
}
