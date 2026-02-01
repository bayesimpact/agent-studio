import { ChatBotRoute } from "../ChatBotRoute"
import { ChatSessionRoute } from "../ChatSessionRoute"
import { DashboardRoute } from "../DashboardRoute"
import { buildAppPath, RouteNames } from "../helpers"
import { ChatBotLoader } from "../loaders/ChatBotLoader"
import { ChatBotsLoader } from "../loaders/ChatBotsLoader"
import { ChatSessionLoader } from "../loaders/ChatSessionLoader"
import { ChatSessionsLoader } from "../loaders/ChatSessionsLoader"
import { ProjectLoader } from "../loaders/ProjectLoader"
import { ProjectsLoader } from "../loaders/ProjectsLoader"
import { UserHoc } from "../loaders/UserHoc"
import { OrganizationsLoader } from "../OrganizationsLoader"
import { ProjectRoute } from "../ProjectRoute"
import { ProtectedRoute } from "../ProtectedRoute"

export const appRoutes = [
  {
    path: buildAppPath(RouteNames.ORGANIZATION_DASHBOARD),
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
        element: <div>TODO: Dashboard App</div>,
      },
      {
        path: buildAppPath(RouteNames.PROJECT),
        element: (
          <ProjectLoader>
            <ChatBotsLoader>
              <ProjectRoute />
            </ChatBotsLoader>
          </ProjectLoader>
        ),
        children: [
          {
            path: buildAppPath(RouteNames.CHAT_BOT),
            element: (
              <ChatBotLoader>
                <ChatSessionsLoader>
                  <ChatBotRoute />
                </ChatSessionsLoader>
              </ChatBotLoader>
            ),
            children: [
              {
                path: buildAppPath(RouteNames.CHAT_SESSION),
                element: (
                  <ChatSessionLoader>
                    <ChatSessionRoute />
                  </ChatSessionLoader>
                ),
              },
            ],
          },
        ],
      },
    ],
  },
]
