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
  DOCUMENTS = "/o/:organizationId/p/:projectId/r",
  DOCUMENT = "/o/:organizationId/p/:projectId/r/:documentId",

  // END USER ROUTES
  APP = "/app",
}

export const buildAdminPath = (path: string) => {
  return `${RouteNames.ADMIN}${path}`
}

export const buildAppPath = (path: string) => {
  return `${RouteNames.APP}${path}`
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
