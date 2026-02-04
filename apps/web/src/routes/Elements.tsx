import { ChatBotRoute } from "./ChatBotRoute"
import { ChatSessionRoute } from "./ChatSessionRoute"
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

    case RouteNames.CHAT_BOT:
      return <ChatBotRoute />

    case RouteNames.CHAT_SESSION:
      return <ChatSessionRoute />

    default:
      break
  }
}
