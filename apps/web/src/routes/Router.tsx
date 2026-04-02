import { useEffect } from "react"
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom"
import { RestrictedFeature } from "@/components/RestrictedFeature"
import { selectAbilities } from "@/features/auth/auth.selectors"
import { authActions } from "@/features/auth/auth.slice"
import { HomeRoute } from "@/routes/HomeRoute"
import { LoginRoute } from "@/routes/LoginRoute"
import { LogoutRoute } from "@/routes/LogoutRoute"
import { NotFoundRoute } from "@/routes/NotFoundRoute"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { getElement } from "./Elements"
import { buildAppPath, buildStudioPath, RouteNames } from "./helpers"
import { OnboardingRoute } from "./OnboardingRoute"
import { ProtectedRoute } from "./ProtectedRoute"
import { AgentMembershipsRoute } from "./studio/AgentMembershipsRoute"
import { AnalyticsRoute } from "./studio/AnalyticsRoute"
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
                  element: <AnalyticsRoute />,
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

function Studio() {
  const dispatch = useAppDispatch()
  const abilities = useAppSelector(selectAbilities)

  useEffect(() => {
    dispatch(authActions.setIsStudioInterface(true))
    return () => {
      dispatch(authActions.setIsStudioInterface(false))
    }
  }, [dispatch])

  const canAccessStudio = abilities.canManageOrganizations || abilities.canManageProjects
  if (!canAccessStudio) return <NotFoundRoute />
  return <Outlet />
}

function App() {
  const dispatch = useAppDispatch()
  useEffect(() => {
    dispatch(authActions.setIsStudioInterface(false))
  }, [dispatch])
  return <Outlet />
}
