import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom"
import { RestrictedFeature } from "@/components/RestrictedFeature"
import { HomeRoute } from "@/routes/HomeRoute"
import { LoginRoute } from "@/routes/LoginRoute"
import { LogoutRoute } from "@/routes/LogoutRoute"
import { NotFoundRoute } from "@/routes/NotFoundRoute"
import { DocumentsRoute } from "./admin/DocumentsRoute"
import { EvaluationRoute } from "./admin/EvaluationRoute"
import { FeedbackRoute } from "./admin/FeedbackRoute"
import { ProjectMembershipsRoute } from "./admin/ProjectMembershipsRoute"
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
      element: <Outlet />,
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
                  path: buildAdminPath(RouteNames.EVALUATION),
                  element: (
                    <RestrictedFeature feature="evaluation">
                      <EvaluationRoute />
                    </RestrictedFeature>
                  ),
                },
                {
                  path: buildAdminPath(RouteNames.DOCUMENTS),
                  element: <DocumentsRoute />,
                },
                {
                  path: buildAdminPath(RouteNames.PROJECT_MEMBERSHIPS),
                  element: <ProjectMembershipsRoute />,
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
                      path: buildAdminPath(RouteNames.FEEDBACK),
                      element: <FeedbackRoute />,
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
      element: <Outlet />,
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
