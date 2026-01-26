export enum RouteNames {
  HOME = "/",
  LOGIN = "/login",
  LOGOUT = "/logout",
  ONBOARDING = "/onboarding",
  ORGANIZATION_DASHBOARD = "/o/:organizationId",
  PROJECT = "/o/:organizationId/p/:projectId",
  CHAT_BOT = "/o/:organizationId/p/:projectId/cb/:chatBotId",
  USER_CHAT = "/chat/:chatSessionId",
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

export const buildChatBotPath = ({
  organizationId,
  projectId,
  chatBotId,
}: {
  organizationId: string
  projectId: string
  chatBotId: string
}) => {
  return `/o/${organizationId}/p/${projectId}/cb/${chatBotId}`
}

export const buildUserChatPath = ({ chatSessionId }: { chatSessionId: string }) => {
  return `/chat/${chatSessionId}`
}
