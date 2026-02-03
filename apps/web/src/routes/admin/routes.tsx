import { getElement } from "../Elements"
import { buildAdminPath, RouteNames } from "../helpers"

export const adminRoutes = [
  {
    path: buildAdminPath(RouteNames.ORGANIZATION_DASHBOARD),
    element: getElement(RouteNames.ORGANIZATION_DASHBOARD),
    children: [
      {
        index: true,
        element: <div>TODO: Admin Dashboard</div>,
      },
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
]
