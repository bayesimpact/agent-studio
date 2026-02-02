import { useCallback, useMemo } from "react"
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

export type PathType =
  | "organization"
  | "project"
  | "chatBot"
  | "chatSession"
  | "onboarding"
  | "closestParent"

export function useBuildPath() {
  const { admin } = useAbility()
  const { organizationId, projectId, chatBotId, chatSessionId } = useParams()
  const organizations = useAppSelector(selectOrganizations)
  const projects = useAppSelector(selectProjects)
  const chatBots = useAppSelector(selectChatBots(projectId))
  const chatSessions = useAppSelector(selectChatSessions)

  const organizationFound = useMemo(
    () => (organizationId && organizations?.find((org) => org.id === organizationId)) || null,
    [organizationId, organizations],
  )

  const projectFound = useMemo(
    () => (projectId && projects?.find((proj) => proj.id === projectId)) || null,
    [projectId, projects],
  )

  const chatBotFound = useMemo(
    () => (chatBotId && chatBots?.find((cb) => cb.id === chatBotId)) || null,
    [chatBotId, chatBots],
  )

  const chatSessionFound = useMemo(
    () => (chatSessionId && chatSessions?.find((cs) => cs.id === chatSessionId)) || null,
    [chatSessionId, chatSessions],
  )

  const getPath = useCallback(
    (pathType: PathType): string => {
      const organizationPath = organizationFound
        ? buildOrganizationPath({
            organizationId: organizationFound.id,
            admin,
          })
        : RouteNames.HOME

      if (pathType === "organization") {
        return organizationPath
      }

      const projectPath =
        organizationFound && projectFound
          ? buildProjectPath({
              organizationId: organizationFound.id,
              projectId: projectFound.id,
              admin,
            })
          : organizationPath

      if (pathType === "project") {
        return projectPath
      }

      const chatBotPath =
        organizationFound && projectFound && chatBotFound
          ? buildChatBotPath({
              organizationId: organizationFound.id,
              projectId: projectFound.id,
              chatBotId: chatBotFound.id,
              admin,
            })
          : projectPath

      if (pathType === "chatBot") {
        return chatBotPath
      }

      const chatSessionPath =
        organizationFound && projectFound && chatBotFound && chatSessionFound
          ? buildChatSessionPath({
              organizationId: organizationFound.id,
              projectId: projectFound.id,
              chatBotId: chatBotFound.id,
              chatSessionId: chatSessionFound.id,
              admin,
            })
          : chatBotPath

      if (pathType === "chatSession") {
        return chatSessionPath
      }

      if (pathType === "onboarding") {
        return admin ? buildAdminPath(RouteNames.ONBOARDING) : buildAppPath(RouteNames.ONBOARDING)
      }

      // closestParent
      return chatSessionPath || chatBotPath || projectPath || organizationPath || RouteNames.HOME
    },
    [admin, organizationFound, projectFound, chatBotFound, chatSessionFound],
  )

  return { getPath }
}
