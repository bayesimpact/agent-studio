import { useParams } from "react-router-dom"
import { selectChatBots } from "@/features/chat-bots/chat-bots.selectors"
import { selectChatSessions } from "@/features/chat-sessions/chat-sessions.selectors"
import { selectOrganizations } from "@/features/organizations/organizations.selectors"
import { selectProjects } from "@/features/projects/projects.selectors"
import {
  buildAdminPath,
  buildAppPath,
  buildChatBotPath,
  buildChatSessionPath,
  buildOrganizationPath,
  buildProjectPath,
  RouteNames,
} from "@/routes/helpers"
import { useAppSelector } from "@/store/hooks"
import { useAbility } from "./use-ability"

export function useBuildPath() {
  const { admin } = useAbility()
  const { organizationId, projectId, chatBotId, chatSessionId } = useParams()
  const organizations = useAppSelector(selectOrganizations)
  const projects = useAppSelector(selectProjects)
  const chatBots = useAppSelector(selectChatBots(projectId))
  const chatSessions = useAppSelector(selectChatSessions)

  const organizationPath =
    organizationId && organizations?.find((org) => org.id === organizationId)
      ? buildOrganizationPath({
          organizationId,
          admin,
        })
      : RouteNames.HOME

  const projectPath =
    organizationId &&
    projectId &&
    organizations?.find((org) => org.id === organizationId) &&
    projects?.find((proj) => proj.id === projectId)
      ? buildProjectPath({
          organizationId,
          projectId,
          admin,
        })
      : organizationPath || RouteNames.HOME

  const chatBotPath =
    organizationId &&
    projectId &&
    chatBotId &&
    organizations?.find((org) => org.id === organizationId) &&
    projects?.find((proj) => proj.id === projectId) &&
    chatBots?.find((cb) => cb.id === chatBotId)
      ? buildChatBotPath({
          organizationId,
          projectId,
          chatBotId,
          admin,
        })
      : projectPath || organizationPath || RouteNames.HOME

  const chatSessionPath =
    organizationId &&
    projectId &&
    chatBotId &&
    chatSessionId &&
    organizations?.find((org) => org.id === organizationId) &&
    projects?.find((proj) => proj.id === projectId) &&
    chatBots?.find((cb) => cb.id === chatBotId) &&
    chatSessions?.find((cs) => cs.id === chatSessionId)
      ? buildChatSessionPath({
          organizationId,
          projectId,
          chatBotId,
          chatSessionId,
          admin,
        })
      : chatBotPath || projectPath || organizationPath || RouteNames.HOME

  const onboardingPath = admin
    ? buildAdminPath(RouteNames.ONBOARDING)
    : buildAppPath(RouteNames.ONBOARDING)

  const closestParentPath =
    chatSessionPath || chatBotPath || projectPath || organizationPath || RouteNames.HOME
  return {
    chatBotPath,
    chatSessionPath,
    closestParentPath,
    onboardingPath,
    organizationPath,
    projectPath,
  }
}
