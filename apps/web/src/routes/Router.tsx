import { useEffect } from "react"
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom"
import { RestrictedFeature } from "@/components/RestrictedFeature"
import { authActions } from "@/features/auth/auth.slice"
import { HomeRoute } from "@/routes/HomeRoute"
import { LoginRoute } from "@/routes/LoginRoute"
import { LogoutRoute } from "@/routes/LogoutRoute"
import { NotFoundRoute } from "@/routes/NotFoundRoute"
import { useAppDispatch } from "@/store/hooks"
import { Studio } from "@/studio/routes/StudioRoute"
import { AgentMembershipsRoute } from "../studio/routes/AgentMembershipsRoute"
import { AnalyticsRoute } from "../studio/routes/AnalyticsRoute"
import { DocumentsRoute } from "../studio/routes/DocumentsRoute"
import { EvaluationRoute } from "../studio/routes/EvaluationRoute"
import { FeedbackRoute } from "../studio/routes/FeedbackRoute"
import { ProjectMembershipsRoute } from "../studio/routes/ProjectMembershipsRoute"
import { getElement } from "./Elements"
import { buildAppPath, buildStudioPath, RouteNames } from "./helpers"
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
      path: RouteNames.STUDIO,
      element: (
        <ProtectedRoute>
          <Studio />
        </ProtectedRoute>
      ),
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
                  path: buildStudioPath(RouteNames.ANALYTICS),
                  element: (
                    <RestrictedFeature feature="project-analytics">
                      <AnalyticsRoute />
                    </RestrictedFeature>
                  ),
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
                    {
                      path: buildStudioPath(RouteNames.AGENT_MEMBERSHIPS),
                      element: <AgentMembershipsRoute />,
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
      element: (
        <ProtectedRoute>
          <App />
        </ProtectedRoute>
      ),
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

function App() {
  const dispatch = useAppDispatch()
  useEffect(() => {
    dispatch(authActions.setIsStudioInterface(false))
  }, [dispatch])
  return <Outlet />
}
