export enum RouteNames {
  // COMMON ROUTES
  HOME = "/",
  LOGOUT = "/logout",
  ONBOARDING = "/onboarding",
  ORGANIZATION_DASHBOARD = "/o/:organizationId",
  PROJECT = "/o/:organizationId/p/:projectId",
  AGENT = "/o/:organizationId/p/:projectId/a/:agentId",
  AGENT_SESSION = "/o/:organizationId/p/:projectId/a/:agentId/as/:agentSessionId",
}
