import { useEffect } from "react"
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom"
import { authActions } from "@/features/auth/auth.slice"
import { HomeRoute } from "@/routes/HomeRoute"
import { LoginRoute } from "@/routes/LoginRoute"
import { LogoutRoute } from "@/routes/LogoutRoute"
import { NotFoundRoute } from "@/routes/NotFoundRoute"
import { useAppDispatch } from "@/store/hooks"
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
              path: buildAdminPath(RouteNames.PROJECT),
              element: getElement(RouteNames.PROJECT),
              children: [
                {
                  path: buildAdminPath(RouteNames.CHAT_BOT),
                  element: getElement(RouteNames.CHAT_BOT),
                  children: [
                    {
                      path: buildAdminPath(RouteNames.CHAT_SESSION),
                      element: getElement(RouteNames.CHAT_SESSION),
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
              path: buildAppPath(RouteNames.PROJECT),
              element: getElement(RouteNames.PROJECT),
              children: [
                {
                  path: buildAppPath(RouteNames.CHAT_BOT),
                  element: getElement(RouteNames.CHAT_BOT),
                  children: [
                    {
                      path: buildAppPath(RouteNames.CHAT_SESSION),
                      element: getElement(RouteNames.CHAT_SESSION),
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
