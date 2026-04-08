import { RouteNames } from "@/common/routes/helpers"
import { DeskRouteNames } from "@/desk/routes/helpers"

export enum StudioRouteNames {
  // STUDIO ROUTES
  STUDIO = "/studio",
  STUDIO2 = "/studio2",
  DOCUMENTS = "/o/:organizationId/p/:projectId/d",
  DOCUMENT = "/o/:organizationId/p/:projectId/d/:documentId",
  ANALYTICS = "/o/:organizationId/p/:projectId/analytics",
  EVALUATION = "/o/:organizationId/p/:projectId/eval",
  PROJECT_MEMBERSHIPS = "/o/:organizationId/p/:projectId/members",
  FEEDBACK = "/o/:organizationId/p/:projectId/a/:agentId/f",
  AGENT_MEMBERSHIPS = "/o/:organizationId/p/:projectId/a/:agentId/members",
}

export const buildStudioPath = (path: string) => {
  return `${StudioRouteNames.STUDIO}${path}`
}
export const buildStudio2Path = (path: string) => {
  return `${StudioRouteNames.STUDIO2}${path}`
}

const prefix = window.location.pathname.startsWith(`${StudioRouteNames.STUDIO}/`)
  ? StudioRouteNames.STUDIO
  : window.location.pathname.startsWith(`${StudioRouteNames.STUDIO2}/`)
    ? StudioRouteNames.STUDIO2
    : DeskRouteNames.APP
const buildPath = prefix === StudioRouteNames.STUDIO2 ? buildStudio2Path : buildStudioPath

export const buildOrganizationDashboardPath = ({ organizationId }: { organizationId: string }) => {
  return buildPath(
    RouteNames.ORGANIZATION_DASHBOARD.toString().replace(":organizationId", organizationId),
  )
}

export const buildDocumentsPath = ({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) => {
  return buildPath(
    StudioRouteNames.DOCUMENTS.toString()
      .replace(":organizationId", organizationId)
      .replace(":projectId", projectId),
  )
}

export const buildAnalyticsPath = ({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) => {
  return buildPath(
    StudioRouteNames.ANALYTICS.toString()
      .replace(":organizationId", organizationId)
      .replace(":projectId", projectId),
  )
}

export const buildEvaluationPath = ({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) => {
  return buildPath(
    StudioRouteNames.EVALUATION.toString()
      .replace(":organizationId", organizationId)
      .replace(":projectId", projectId),
  )
}

export const buildFeedbackPath = ({
  organizationId,
  projectId,
  agentId,
}: {
  organizationId: string
  projectId: string
  agentId: string
}) => {
  return buildPath(
    StudioRouteNames.FEEDBACK.toString()
      .replace(":organizationId", organizationId)
      .replace(":projectId", projectId)
      .replace(":agentId", agentId),
  )
}

export const buildProjectMembershipsPath = ({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) => {
  return buildPath(
    StudioRouteNames.PROJECT_MEMBERSHIPS.toString()
      .replace(":organizationId", organizationId)
      .replace(":projectId", projectId),
  )
}

export const buildAgentMembershipsPath = ({
  organizationId,
  projectId,
  agentId,
}: {
  organizationId: string
  projectId: string
  agentId: string
}) => {
  return buildPath(
    StudioRouteNames.AGENT_MEMBERSHIPS.toString()
      .replace(":organizationId", organizationId)
      .replace(":projectId", projectId)
      .replace(":agentId", agentId),
  )
}

export const isStudioInterface = () => window.location.pathname.startsWith(StudioRouteNames.STUDIO)
