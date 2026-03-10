import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom"
import { RestrictedFeature } from "@/components/RestrictedFeature"
import { HomeRoute } from "@/routes/HomeRoute"
import { LoginRoute } from "@/routes/LoginRoute"
import { LogoutRoute } from "@/routes/LogoutRoute"
import { NotFoundRoute } from "@/routes/NotFoundRoute"
import { getElement } from "./Elements"
import { buildAppPath, buildStudioPath, RouteNames } from "./helpers"
import { OnboardingRoute } from "./OnboardingRoute"
import { ProtectedRoute } from "./ProtectedRoute"
import { DocumentsRoute } from "./studio/DocumentsRoute"
import { EvaluationRoute } from "./studio/EvaluationRoute"
import { FeedbackRoute } from "./studio/FeedbackRoute"
import { ProjectMembershipsRoute } from "./studio/ProjectMembershipsRoute"

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
      path: RouteNames.STUDIO,
      element: <Outlet />,
      children: [
        {
          path: buildStudioPath(RouteNames.ORGANIZATION_DASHBOARD),
          element: getElement(RouteNames.ORGANIZATION_DASHBOARD),
          children: [
            {
              path: buildStudioPath(RouteNames.PROJECT),
              element: getElement(RouteNames.PROJECT),
              children: [
                {
                  path: buildStudioPath(RouteNames.EVALUATION),
                  element: (
                    <RestrictedFeature feature="evaluation">
                      <EvaluationRoute />
                    </RestrictedFeature>
                  ),
                },
                {
                  path: buildStudioPath(RouteNames.DOCUMENTS),
                  element: <DocumentsRoute />,
                },
                {
                  path: buildStudioPath(RouteNames.PROJECT_MEMBERSHIPS),
                  element: <ProjectMembershipsRoute />,
                },
                {
                  path: buildStudioPath(RouteNames.AGENT),
                  element: getElement(RouteNames.AGENT),
                  children: [
                    {
                      path: buildStudioPath(RouteNames.AGENT_SESSION),
                      element: getElement(RouteNames.AGENT_SESSION),
                    },
                    {
                      path: buildStudioPath(RouteNames.FEEDBACK),
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
      path: RouteNames.APP,
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
