import { BrowserRouter, Route, Routes } from "react-router-dom"
import { GuestRoute } from "@/routes/GuestRoute"
import { HomeRoute } from "@/routes/HomeRoute"
import { LoginRoute } from "@/routes/LoginRoute"
import { LogoutRoute } from "@/routes/LogoutRoute"
import { NotFoundRoute } from "@/routes/NotFoundRoute"
import { OnboardingRoute } from "@/routes/OnboardingRoute"
import { ProjectRoute } from "@/routes/ProjectRoute"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { DashboardRoute } from "./DashboardRoute"
import { RouteNames } from "./helpers"

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={RouteNames.HOME} element={<HomeRoute />} />
        <Route path="/guest" element={<GuestRoute />} />
        <Route path={RouteNames.LOGIN} element={<LoginRoute />} />
        <Route path={RouteNames.LOGOUT} element={<LogoutRoute />} />
        <Route
          path={RouteNames.ONBOARDING}
          element={
            <ProtectedRoute>
              <OnboardingRoute />
            </ProtectedRoute>
          }
        />

        <Route
          path={RouteNames.ORGANIZATION_DASHBOARD}
          element={
            <ProtectedRoute>
              <DashboardRoute />
            </ProtectedRoute>
          }
        >
          {/* Index route */}
          <Route index element={<div>TODO: Dashboard</div>} />

          {/* Sub-route */}
          <Route path={RouteNames.PROJECT} element={<ProjectRoute />} />
        </Route>

        <Route path="*" element={<NotFoundRoute />} />
      </Routes>
    </BrowserRouter>
  )
}
