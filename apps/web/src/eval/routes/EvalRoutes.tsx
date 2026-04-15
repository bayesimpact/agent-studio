import { useEffect } from "react"
import { Outlet, useParams } from "react-router-dom"
import { useFeatureFlags } from "@/common/hooks/use-feature-flags"
import { DashboardRoute } from "@/common/routes/DashboardRoute"
import { RouteNames } from "@/common/routes/helpers"
import { LoadingRoute } from "@/common/routes/LoadingRoute"
import { NotFoundRoute } from "@/common/routes/NotFoundRoute"
import { ProjectRoute } from "@/common/routes/ProjectRoute"
import { ProtectedRoute } from "@/common/routes/ProtectedRoute"
import { useAppDispatch } from "@/common/store/hooks"
import { Dashboard } from "../components/Dashboard"
import { datasetsActions } from "../features/datasets/datasets.slice"
import { useInitStore } from "../hooks/use-init-store"
import { DatasetRoute } from "./DatasetRoute"
import { EvalDashboardRoute } from "./EvalDashboardRoute"
import { ExtractionRoute } from "./ExtractionRoute"
import { buildEvalPath, EvalRouteNames } from "./helpers"

export const evalRoutes = {
  path: EvalRouteNames.APP,
  element: (
    <ProtectedRoute>
      <EvalRoute />
    </ProtectedRoute>
  ),
  children: [
    {
      path: buildEvalPath(RouteNames.ORGANIZATION_DASHBOARD),
      element: (
        <DashboardRoute>
          {(user, _projects, organization) => (
            <EvalDashboardRoute user={user} organization={organization} />
          )}
        </DashboardRoute>
      ),
      children: [
        {
          path: buildEvalPath(RouteNames.PROJECT),
          element: <ProjectRoute>{() => <ProjectRouteHandler />}</ProjectRoute>,
          children: [
            {
              path: buildEvalPath(EvalRouteNames.EXTRACTION),
              element: <ExtractionRoute />,
              children: [
                {
                  path: buildEvalPath(EvalRouteNames.EXTRACTION_DATASET),
                  element: <DatasetRoute />,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

function EvalRoute() {
  return <Outlet />
}

const useSetCurrentIds = () => {
  const dispatch = useAppDispatch()
  const params = useParams()
  useEffect(() => {
    const { datasetId } = params
    dispatch(datasetsActions.setCurrentDatasetId({ datasetId: datasetId || null }))
  }, [dispatch, params])
}

function ProjectRouteHandler() {
  const { hasFeature } = useFeatureFlags()
  const isAllowed = hasFeature("evaluation")
  const { initDone } = useInitStore(isAllowed)
  useSetCurrentIds()
  if (isAllowed) {
    if (initDone) return <Dashboard />
    return <LoadingRoute />
  }
  return <NotFoundRoute redirectToHome />
}
