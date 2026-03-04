export enum RouteNames {
  // COMMON ROUTES
  HOME = "/",
  LOGIN = "/login",
  LOGOUT = "/logout",
  ONBOARDING = "/onboarding",
  ORGANIZATION_DASHBOARD = "/o/:organizationId",
  PROJECT = "/o/:organizationId/p/:projectId",

  AGENT = "/o/:organizationId/p/:projectId/a/:agentId",
  AGENT_SESSION = "/o/:organizationId/p/:projectId/a/:agentId/as/:agentSessionId",

  // ADMIN ROUTES
  ADMIN = "/admin",
  DOCUMENTS = "/o/:organizationId/p/:projectId/d",
  DOCUMENT = "/o/:organizationId/p/:projectId/d/:documentId",
  EVALUATION = "/o/:organizationId/p/:projectId/eval",
  FEEDBACK = "/o/:organizationId/p/:projectId/a/:agentId/f",
  PROJECT_MEMBERSHIPS = "/o/:organizationId/p/:projectId/members",

  // END USER ROUTES
  APP = "/app",
}

export const buildAdminPath = (path: string) => {
  return `${RouteNames.ADMIN}${path}`
}

export const buildAppPath = (path: string) => {
  return `${RouteNames.APP}${path}`
}

export const buildOrganizationDashboardPath = ({ organizationId }: { organizationId: string }) => {
  return buildAdminPath(
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
  return buildAdminPath(
    RouteNames.DOCUMENTS.toString()
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
  return buildAdminPath(
    RouteNames.EVALUATION.toString()
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
  return buildAdminPath(
    RouteNames.FEEDBACK.toString()
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
  return buildAdminPath(
    RouteNames.PROJECT_MEMBERSHIPS.toString()
      .replace(":organizationId", organizationId)
      .replace(":projectId", projectId),
  )
}
