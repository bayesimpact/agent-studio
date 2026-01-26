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
import { ChatBotRoute } from "./ChatBotRoute"
import { DashboardRoute } from "./DashboardRoute"
import { RouteNames } from "./helpers"
import { LoadingRoute } from "./LoadingRoute"
import { loadChatBot } from "./loaders/load-chat-bot"
import { loadProjectAndChatBots } from "./loaders/load-project"
import { loadProjects } from "./loaders/load-projects"
import { OrganizationsHoc } from "./OrganizationsHoc"
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
      loader: async ({ params }) => loadProjects({ dispatch, params }),
      hydrateFallbackElement: <LoadingRoute />,
      errorElement: <NotFoundRoute />,
      element: (
        <ProtectedRoute>
          <UserHoc>
            {(user) => {
              return (
                <OrganizationsHoc>
                  {(_organizations) => <DashboardRoute user={user} />}
                </OrganizationsHoc>
              )
            }}
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
          loader: async ({ params }) => loadProjectAndChatBots({ dispatch, params }),
          hydrateFallbackElement: <LoadingRoute />,
          errorElement: <NotFoundRoute />,
          element: <ProjectRoute />,
          children: [
            {
              path: RouteNames.CHAT_BOT,
              loader: async ({ params }) => loadChatBot({ dispatch, params }),
              errorElement: <NotFoundRoute />,
              hydrateFallbackElement: <LoadingRoute />,
              element: <ChatBotRoute />,
            },
          ],
        },
      ],
    },
    {
      path: RouteNames.USER_CHAT,
      // loader: async ({ params }) => loadProjects({ dispatch, params }), // TODO:
      hydrateFallbackElement: <LoadingRoute />,
      errorElement: <NotFoundRoute />,
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
