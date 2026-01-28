import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { GuestRoute } from "@/routes/GuestRoute"
import { HomeRoute } from "@/routes/HomeRoute"
import { LoginRoute } from "@/routes/LoginRoute"
import { LogoutRoute } from "@/routes/LogoutRoute"
import { NotFoundRoute } from "@/routes/NotFoundRoute"
import { OnboardingRoute } from "@/routes/OnboardingRoute"
import { ProjectRoute } from "@/routes/ProjectRoute"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { ChatBotRoute } from "./ChatBotRoute"
import { DashboardRoute } from "./DashboardRoute"
import { RouteNames } from "./helpers"
import { ChatBotLoader } from "./loaders/ChatBotLoader"
import { ChatBotsLoader } from "./loaders/ChatBotsLoader"
import { ChatSessionLoader } from "./loaders/ChatSessionLoader"
import { ProjectLoader } from "./loaders/ProjectLoader"
import { ProjectsLoader } from "./loaders/ProjectsLoader"
import { UserHoc } from "./loaders/UserHoc"
import { OrganizationsLoader } from "./OrganizationsLoader"
import { UserChatRoute } from "./UserChatRoute"

const router = () =>
  createBrowserRouter([
    {
      path: RouteNames.HOME,
      element: <HomeRoute />,
    },
    {
      path: "/guest",
      element: <GuestRoute />,
    },
    {
      path: RouteNames.LOGIN,
      element: <LoginRoute />,
    },
    {
      path: RouteNames.LOGOUT,
      element: <LogoutRoute />,
    },
    {
      path: RouteNames.ONBOARDING,
      element: (
        <ProtectedRoute>
          <OnboardingRoute />
        </ProtectedRoute>
      ),
    },
    {
      path: RouteNames.ORGANIZATION_DASHBOARD,
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
          path: RouteNames.PROJECT,
          element: (
            <ProjectLoader>
              <ChatBotsLoader>
                <ProjectRoute />
              </ChatBotsLoader>
            </ProjectLoader>
          ),
          children: [
            {
              path: RouteNames.CHAT_BOT,
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
    {
      path: RouteNames.USER_CHAT,
      element: (
        <ProtectedRoute>
          <UserHoc>
            {(user) => {
              return <UserChatRoute user={user} />
            }}
          </UserHoc>
        </ProtectedRoute>
      ),
    },
    {
      path: "*",
      element: <NotFoundRoute />,
    },
  ])

export function Router() {
  return <RouterProvider router={router()} />
}
