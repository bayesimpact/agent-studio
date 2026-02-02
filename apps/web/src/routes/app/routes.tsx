import { getElement } from "../Elements"
import { buildAppPath, RouteNames } from "../helpers"
import { ProtectedRoute } from "../ProtectedRoute"
import { AppOnboardingRoute } from "./AppOnboardingRoute"

export const appRoutes = [
  {
    path: buildAppPath(RouteNames.ONBOARDING),
    element: (
      <ProtectedRoute>
        <AppOnboardingRoute />
      </ProtectedRoute>
    ),
  },
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
]
