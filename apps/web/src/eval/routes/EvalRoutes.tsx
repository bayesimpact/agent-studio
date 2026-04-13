import { Outlet } from "react-router-dom"
import { FileUploader } from "@/common/components/FileUploader"
import type { Agent } from "@/common/features/agents/agents.models"
import type { Project } from "@/common/features/projects/projects.models"
import { useAbility } from "@/common/hooks/use-ability"
import { useFeatureFlags } from "@/common/hooks/use-feature-flags"
import { DashboardRoute } from "@/common/routes/DashboardRoute"
import { RouteNames } from "@/common/routes/helpers"
import { NotFoundRoute } from "@/common/routes/NotFoundRoute"
import { ProjectRoute } from "@/common/routes/ProjectRoute"
import { ProtectedRoute } from "@/common/routes/ProtectedRoute"
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
          element: (
            <ProjectRoute>
              {(agents, project) => <ProjectRouteHandler agents={agents} project={project} />}
            </ProjectRoute>
          ),
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

function ProjectRouteHandler({ _agents, _project }: { agents: Agent[]; project: Project }) {
  const { hasFeature } = useFeatureFlags()
  if (hasFeature("evaluation"))
    return (
      <div>
        <UploadDataset />
        TODO: create and list datasets
      </div>
    )
  return <NotFoundRoute redirectToHome />
}

function UploadDataset() {
  return (
    <FileUploader
      maxFiles={1}
      allowedMimeTypes={{
        "text/csv": true,
      }}
      onDropFiles={() => {}}
      onProcessFiles={async () => {}}
      onProcessEnd={() => {}}
    />
  )
}
