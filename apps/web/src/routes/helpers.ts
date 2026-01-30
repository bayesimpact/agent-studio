export enum RouteNames {
  // COMMON ROUTES
  HOME = "/",
  LOGIN = "/login",
  LOGOUT = "/logout",
  ONBOARDING = "/onboarding",
  ORGANIZATION_DASHBOARD = "/o/:organizationId",
  PROJECT = "/o/:organizationId/p/:projectId",
  CHAT_BOT = "/o/:organizationId/p/:projectId/cb/:chatBotId",

  // ADMIN ROUTES
  ADMIN = "/admin",

  // END USER ROUTES
  APP = "/app",
}

export const buildAdminPath = (path: string) => {
  return `${RouteNames.ADMIN}${path}`
}

export const buildAppPath = (path: string) => {
  return `${RouteNames.APP}${path}`
}

export const buildOrganizationPath = ({
  organizationId,
  admin,
}: {
  organizationId: string
  admin: boolean
}) => {
  const path = `/o/${organizationId}`
  if (admin) return buildAdminPath(path)
  return buildAppPath(path)
}

export const buildProjectPath = ({
  organizationId,
  projectId,
  admin,
}: {
  organizationId: string
  projectId: string
  admin: boolean
}) => {
  const path = `/o/${organizationId}/p/${projectId}`
  if (admin) return buildAdminPath(path)
  return buildAppPath(path)
}

export const buildChatBotPath = ({
  organizationId,
  projectId,
  chatBotId,
  admin,
}: {
  organizationId: string
  projectId: string
  chatBotId: string
  admin: boolean
}) => {
  const path = `/o/${organizationId}/p/${projectId}/cb/${chatBotId}`
  if (admin) return buildAdminPath(path)
  return buildAppPath(path)
}
