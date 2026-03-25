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

  // STUDIO ROUTES
  STUDIO = "/studio",
  DOCUMENTS = "/o/:organizationId/p/:projectId/d",
  DOCUMENT = "/o/:organizationId/p/:projectId/d/:documentId",
  EVALUATION = "/o/:organizationId/p/:projectId/eval",
  PROJECT_MEMBERSHIPS = "/o/:organizationId/p/:projectId/members",
  FEEDBACK = "/o/:organizationId/p/:projectId/a/:agentId/f",
  AGENT_MEMBERSHIPS = "/o/:organizationId/p/:projectId/a/:agentId/members",

  // END USER ROUTES
  APP = "/app",
}

export const buildStudioPath = (path: string) => {
  return `${RouteNames.STUDIO}${path}`
}

export const buildAppPath = (path: string) => {
  return `${RouteNames.APP}${path}`
}

export const buildOrganizationDashboardPath = ({ organizationId }: { organizationId: string }) => {
  return buildStudioPath(
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
  return buildStudioPath(
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
  return buildStudioPath(
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
  return buildStudioPath(
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
  return buildStudioPath(
    RouteNames.PROJECT_MEMBERSHIPS.toString()
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
  return buildStudioPath(
    RouteNames.AGENT_MEMBERSHIPS.toString()
      .replace(":organizationId", organizationId)
      .replace(":projectId", projectId)
      .replace(":agentId", agentId),
  )
}
