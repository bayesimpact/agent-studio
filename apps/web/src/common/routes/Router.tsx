import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { HomeRoute } from "@/common/routes/HomeRoute"
import { LogoutRoute } from "@/common/routes/LogoutRoute"
import { NotFoundRoute } from "@/common/routes/NotFoundRoute"
import { deskRoutes } from "@/desk/routes/DeskRoutes"
import { studioRoutes } from "@/studio/routes/StudioRoutes"
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
      path: RouteNames.LOGOUT,
      element: <LogoutRoute />,
    },

    studioRoutes,
    deskRoutes,

    {
      path: "*",
      element: <NotFoundRoute />,
    },
  ])

export function Router() {
  return <RouterProvider router={router()} />
}
