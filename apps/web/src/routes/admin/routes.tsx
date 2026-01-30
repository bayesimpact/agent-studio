import { ChatBotRoute } from "../ChatBotRoute"
import { DashboardRoute } from "../DashboardRoute"
import { buildAdminPath, RouteNames } from "../helpers"
import { ChatBotLoader } from "../loaders/ChatBotLoader"
import { ChatBotsLoader } from "../loaders/ChatBotsLoader"
import { ChatSessionLoader } from "../loaders/ChatSessionLoader"
import { ProjectLoader } from "../loaders/ProjectLoader"
import { ProjectsLoader } from "../loaders/ProjectsLoader"
import { UserHoc } from "../loaders/UserHoc"
import { OrganizationsLoader } from "../OrganizationsLoader"
import { ProjectRoute } from "../ProjectRoute"
import { ProtectedRoute } from "../ProtectedRoute"
import { AdminOnboardingRoute } from "./AdminOnboardingRoute"

export const adminRoutes = [
  {
    path: buildAdminPath(RouteNames.ONBOARDING),
    element: (
      <ProtectedRoute>
        <AdminOnboardingRoute />
      </ProtectedRoute>
    ),
  },
  {
    path: buildAdminPath(RouteNames.ORGANIZATION_DASHBOARD),
    element: (
      <ProtectedRoute>
        <UserHoc>
          {(user) => (
            <OrganizationsLoader>
              {(organizationId) => (
                <ProjectsLoader organizationId={organizationId}>
                  <DashboardRoute user={user} />
                </ProjectsLoader>
              )}
            </OrganizationsLoader>
          )}
        </UserHoc>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <div>TODO: Dashboard</div>,
      },
      {
        path: buildAdminPath(RouteNames.PROJECT),
        element: (
          <ProjectLoader>
            <ChatBotsLoader>
              <ProjectRoute />
            </ChatBotsLoader>
          </ProjectLoader>
        ),
        children: [
          {
            path: buildAdminPath(RouteNames.CHAT_BOT),
            element: (
              <ChatBotLoader>
                <ChatSessionLoader>
                  <ChatBotRoute />
                </ChatSessionLoader>
              </ChatBotLoader>
            ),
          },
        ],
      },
    ],
  },
]
