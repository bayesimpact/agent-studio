import { useEffect } from "react"
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom"
import { authActions } from "@/features/auth/auth.slice"
import { HomeRoute } from "@/routes/HomeRoute"
import { LoginRoute } from "@/routes/LoginRoute"
import { LogoutRoute } from "@/routes/LogoutRoute"
import { NotFoundRoute } from "@/routes/NotFoundRoute"
import { useAppDispatch } from "@/store/hooks"
import { DocumentsRoute } from "./admin/DocumentsRoute"
import { FeedbacksRoute } from "./admin/FeedbacksRoute"
import { getElement } from "./Elements"
import { buildAdminPath, buildAppPath, RouteNames } from "./helpers"
import { OnboardingRoute } from "./OnboardingRoute"
import { ProtectedRoute } from "./ProtectedRoute"

const router = () =>
  createBrowserRouter([
    {
      path: RouteNames.HOME,
      element: <HomeRoute />,
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
      path: RouteNames.LOGIN,
      element: <LoginRoute />,
    },
    {
      path: RouteNames.LOGOUT,
      element: <LogoutRoute />,
    },

    {
      path: "/admin",
      element: <AdminInterfaceHandler />,
      children: [
        {
          path: buildAdminPath(RouteNames.ORGANIZATION_DASHBOARD),
          element: getElement(RouteNames.ORGANIZATION_DASHBOARD),
          children: [
            {
              index: true,
              element: <div>TODO: admin Dashboard</div>,
            },
            {
              path: buildAdminPath(RouteNames.PROJECT),
              element: getElement(RouteNames.PROJECT),
              children: [
                {
                  path: buildAdminPath(RouteNames.DOCUMENTS),
                  element: <DocumentsRoute />,
                },
                {
                  path: buildAdminPath(RouteNames.AGENT),
                  element: getElement(RouteNames.AGENT),
                  children: [
                    {
                      path: buildAdminPath(RouteNames.AGENT_SESSION),
                      element: getElement(RouteNames.AGENT_SESSION),
                    },
                    {
                      path: buildAdminPath(RouteNames.FEEDBACKS),
                      element: <FeedbacksRoute />,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      path: "/app",
      element: <AppInterfaceHandler />,
      children: [
        {
          path: buildAppPath(RouteNames.ORGANIZATION_DASHBOARD),
          element: getElement(RouteNames.ORGANIZATION_DASHBOARD),
          children: [
            {
              index: true,
              element: <div>TODO: App Dashboard</div>,
            },
            {
              path: buildAppPath(RouteNames.PROJECT),
              element: getElement(RouteNames.PROJECT),
              children: [
                {
                  path: buildAppPath(RouteNames.AGENT),
                  element: getElement(RouteNames.AGENT),
                  children: [
                    {
                      path: buildAppPath(RouteNames.AGENT_SESSION),
                      element: getElement(RouteNames.AGENT_SESSION),
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },

    {
      path: "*",
      element: <NotFoundRoute />,
    },
  ])

export function Router() {
  return <RouterProvider router={router()} />
}

function AdminInterfaceHandler() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(authActions.setIsAdminInterface(true))
  }, [dispatch])

  return <Outlet />
}
function AppInterfaceHandler() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(authActions.setIsAdminInterface(false))
  }, [dispatch])

  return <Outlet />
}
