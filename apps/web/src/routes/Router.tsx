import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { GuestRoute } from "@/routes/GuestRoute"
import { HomeRoute } from "@/routes/HomeRoute"
import { LoginRoute } from "@/routes/LoginRoute"
import { LogoutRoute } from "@/routes/LogoutRoute"
import { NotFoundRoute } from "@/routes/NotFoundRoute"
import { OnboardingRoute } from "@/routes/OnboardingRoute"
import { ProjectRoute } from "@/routes/ProjectRoute"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import type { AppDispatch } from "@/store"
import { useAppDispatch } from "@/store/hooks"
import { ChatBotLoader } from "./ChatBotLoader"
import { ChatBotRoute } from "./ChatBotRoute"
import { ChatBotsLoader } from "./ChatBotsLoader"
import { DashboardRoute } from "./DashboardRoute"
import { RouteNames } from "./helpers"
import { OrganizationsLoader } from "./OrganizationsLoader"
import { ProjectsLoader } from "./ProjectsLoader"
import { UserChatRoute } from "./UserChatRoute"
import { UserHoc } from "./UserHoc"

const router = (dispatch: AppDispatch) =>
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
            <ChatBotsLoader>
              <ProjectRoute />
            </ChatBotsLoader>
          ),
          children: [
            {
              path: RouteNames.CHAT_BOT,
              element: (
                <ChatBotLoader>
                  <ChatBotRoute />
                </ChatBotLoader>
              ),
            },
          ],
        },
      ],
    },
    {
      path: RouteNames.USER_CHAT,
      // loader: async ({ params }) => loadProjects({ dispatch, params }), // TODO:
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
  const dispatch = useAppDispatch()
  return <RouterProvider router={router(dispatch)} />
}
