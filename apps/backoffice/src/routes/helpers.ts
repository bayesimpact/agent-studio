export enum RouteNames {
  HOME = "/",
  LOGIN = "/login",
  LOGOUT = "/logout",
  ONBOARDING = "/onboarding",
  ORGANIZATION_DASHBOARD = "/o/:organizationId",
  PROJECT = "/o/:organizationId/p/:projectId",
}

export const buildOrganizationPath = (organizationId: string) => {
  return `/o/${organizationId}`
}

export const buildProjectPath = ({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) => {
  return `/o/${organizationId}/p/${projectId}`
}
