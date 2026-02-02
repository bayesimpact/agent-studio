export enum RouteNames {
  // COMMON ROUTES
  HOME = "/",
  LOGIN = "/login",
  LOGOUT = "/logout",
  ONBOARDING = "/onboarding",
  ORGANIZATION_DASHBOARD = "/o/:organizationId",
  PROJECT = "/o/:organizationId/p/:projectId",
  CHAT_BOT = "/o/:organizationId/p/:projectId/cb/:chatBotId",
  CHAT_SESSION = "/o/:organizationId/p/:projectId/cb/:chatBotId/cs/:chatSessionId",

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
