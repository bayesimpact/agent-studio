import { AgentRoute } from "./AgentRoute"
import { AgentSessionRoute } from "./agents/AgentSessionRoute"
import { DashboardRoute } from "./DashboardRoute"
import { RouteNames } from "./helpers"
import { ProjectRoute } from "./ProjectRoute"

export const getElement = (routeNames: RouteNames) => {
  switch (routeNames) {
    case RouteNames.ORGANIZATION_DASHBOARD:
      return <DashboardRoute />

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
