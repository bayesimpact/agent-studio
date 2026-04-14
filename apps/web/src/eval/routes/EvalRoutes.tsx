import { useEffect } from "react"
import { Outlet } from "react-router-dom"
import { useAbility } from "@/common/hooks/use-ability"
import { useFeatureFlags } from "@/common/hooks/use-feature-flags"
import { AsyncRoute } from "@/common/routes/AsyncRoute"
import { DashboardRoute } from "@/common/routes/DashboardRoute"
import { RouteNames } from "@/common/routes/helpers"
import { LoadingRoute } from "@/common/routes/LoadingRoute"
import { NotFoundRoute } from "@/common/routes/NotFoundRoute"
import { ProjectRoute } from "@/common/routes/ProjectRoute"
import { ProtectedRoute } from "@/common/routes/ProtectedRoute"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { Dashboard } from "../components/Dashboard"
import { selectFilesData } from "../features/datasets/datasets.selectors"
import { datasetsActions } from "../features/datasets/datasets.slice"
import { useInitStore } from "../hooks/use-init-store"
import { EvalDashboardRoute } from "./EvalDashboardRoute"
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
        },
      ],
    },
  ],
}

function EvalRoute() {
  const { isPremiumMember } = useAbility()
  if (!isPremiumMember) return <NotFoundRoute redirectToHome />
  return <Outlet />
}

function ProjectRouteHandler() {
  const { hasFeature } = useFeatureFlags()
  const isAllowed = hasFeature("evaluation")
  const { initDone } = useInitStore(isAllowed)
  if (isAllowed) {
    if (initDone) return <WithData />
    return <LoadingRoute />
  }
  return <NotFoundRoute redirectToHome />
}

function WithData() {
  const dispatch = useAppDispatch()
  const filesData = useAppSelector(selectFilesData)
  useEffect(() => {
    dispatch(datasetsActions.initData())
  }, [dispatch])
  return (
    <AsyncRoute data={[filesData]}>{([filesValue]) => <Dashboard files={filesValue} />}</AsyncRoute>
  )
}
