import { useEffect } from "react"
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom"
import { authActions } from "@/features/auth/auth.slice"
import { HomeRoute } from "@/routes/HomeRoute"
import { LoginRoute } from "@/routes/LoginRoute"
import { LogoutRoute } from "@/routes/LogoutRoute"
import { NotFoundRoute } from "@/routes/NotFoundRoute"
import { useAppDispatch } from "@/store/hooks"
import { adminRoutes } from "./admin/routes"
import { appRoutes } from "./app/routes"
import { RouteNames } from "./helpers"
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
      children: adminRoutes,
    },
    {
      path: "/app",
      element: <AppInterfaceHandler />,
      children: appRoutes,
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
