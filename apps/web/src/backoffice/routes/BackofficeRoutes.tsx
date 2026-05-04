import { ProtectedRoute } from "@/common/routes/ProtectedRoute"
import { BackofficeGuard } from "./BackofficeGuard"
import { BackofficeRoute } from "./BackofficeRoute"
import { BackofficeRouteNames } from "./helpers"

export const backofficeRoutes = {
  path: BackofficeRouteNames.HOME,
  element: (
    <ProtectedRoute>
      <BackofficeGuard>
        <BackofficeRoute />
      </BackofficeGuard>
    </ProtectedRoute>
  ),
}
