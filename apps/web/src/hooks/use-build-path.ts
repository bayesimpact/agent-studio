import { useCallback } from "react"
import { useParams } from "react-router-dom"
import { selectChatBotsFromProjectId } from "@/features/chat-bots/chat-bots.selectors"
import { selectChatSessionsFromChatBotId } from "@/features/chat-sessions/chat-sessions.selectors"
import { selectOrganizations } from "@/features/organizations/organizations.selectors"
import { selectProjects } from "@/features/projects/projects.selectors"
import { buildAdminPath, buildAppPath, RouteNames } from "@/routes/helpers"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { useAbility } from "./use-ability"

export type PathType = "organization" | "project" | "chatBot" | "chatSession"

export interface BuildPathOptions {
  organizationId?: string
  projectId?: string
  chatBotId?: string
  chatSessionId?: string
}

export function useGetPath() {
  const { isAdminInterface } = useAbility()
  const {
    organizationId: urlOrganizationId,
    projectId: urlProjectId,
    chatBotId: urlChatBotId,
    chatSessionId: urlChatSessionId,
  } = useParams()

  const computePath = (isAdminInterface: boolean, pathType: PathType): string => {
    const organizationId = urlOrganizationId
    const projectId = urlProjectId
    const chatBotId = urlChatBotId
    const chatSessionId = urlChatSessionId

    const organizationPath = organizationId
      ? buildOrganizationPath({
          organizationId,
          isAdminInterface,
        })
      : RouteNames.HOME

    if (pathType === "organization") {
      return organizationPath
    }

    const projectPath =
      organizationId && projectId
        ? buildProjectPath({
            organizationId,
            projectId,
            isAdminInterface,
          })
        : organizationPath

    if (pathType === "project") {
      return projectPath
    }

    const chatBotPath =
      organizationId && projectId && chatBotId
        ? buildChatBotPath({
            organizationId,
            projectId,
            chatBotId,
            isAdminInterface,
          })
        : projectPath

    if (pathType === "chatBot") {
      return chatBotPath
    }

    const chatSessionPath =
      organizationId && projectId && chatBotId && chatSessionId
        ? buildChatSessionPath({
            organizationId,
            projectId,
            chatBotId,
            chatSessionId,
            isAdminInterface,
          })
        : chatBotPath

    if (pathType === "chatSession") {
      return chatSessionPath
    }

    return RouteNames.HOME
  }

  function getPath(pathType: PathType): string {
    return computePath(isAdminInterface, pathType)
  }

  return { getPath }
}

export function useBuildPath() {
  const { isAdminInterface } = useAbility()

  const computePath = (
    isAdminInterface: boolean,
    pathType: PathType,
    options: BuildPathOptions,
  ): string => {
    const organizationId = options.organizationId
    const projectId = options.projectId
    const chatBotId = options.chatBotId
    const chatSessionId = options.chatSessionId

    const organizationPath = organizationId
      ? buildOrganizationPath({
          organizationId,
          isAdminInterface,
        })
      : RouteNames.HOME

    if (pathType === "organization") {
      return organizationPath
    }

    const projectPath =
      organizationId && projectId
        ? buildProjectPath({
            organizationId,
            projectId,
            isAdminInterface,
          })
        : organizationPath

    if (pathType === "project") {
      return projectPath
    }

    const chatBotPath =
      organizationId && projectId && chatBotId
        ? buildChatBotPath({
            organizationId,
            projectId,
            chatBotId,
            isAdminInterface,
          })
        : projectPath

    if (pathType === "chatBot") {
      return chatBotPath
    }

    const chatSessionPath =
      organizationId && projectId && chatBotId && chatSessionId
        ? buildChatSessionPath({
            organizationId,
            projectId,
            chatBotId,
            chatSessionId,
            isAdminInterface,
          })
        : chatBotPath

    if (pathType === "chatSession") {
      return chatSessionPath
    }

    return RouteNames.HOME
  }

  const buildPath: {
    (
      pathType: "chatSession",
      options: {
        organizationId: string
        projectId: string
        chatBotId: string
        chatSessionId: string
      },
    ): string
    (
      pathType: "chatBot",
      options: { organizationId: string; projectId: string; chatBotId: string },
    ): string
    (pathType: "project", options: { organizationId: string; projectId: string }): string
    (pathType: "organization", options: { organizationId: string }): string
  } = (pathType: PathType, options: BuildPathOptions): string => {
    return computePath(isAdminInterface, pathType, options)
  }

  return { buildPath }
}

export function useClosestParentPath() {
  const { isAdminInterface } = useAbility()
  const {
    organizationId: urlOrganizationId,
    projectId: urlProjectId,
    chatBotId: urlChatBotId,
    chatSessionId: urlChatSessionId,
  } = useParams()
  const organizations = useAppSelector(selectOrganizations)
  const projects = useAppSelector(selectProjects)
  const chatBots = useAppSelector(selectChatBotsFromProjectId(urlProjectId))
  const chatSessions = useAppSelector(selectChatSessionsFromChatBotId(urlChatBotId))

  const foundOrganization = useCallback(
    (organizationId: string | undefined) =>
      organizationId ? organizations?.find((org) => org.id === organizationId) || null : null,
    [organizations],
  )

  const foundProject = useCallback(
    (projectId: string | undefined) =>
      projectId ? projects?.find((proj) => proj.id === projectId) || null : null,
    [projects],
  )

  const foundChatBot = useCallback(
    (chatBotId: string | undefined) =>
      chatBotId
        ? ADS.isFulfilled(chatBots)
          ? chatBots.value.find((cb) => cb.id === chatBotId) || null
          : null
        : null,
    [chatBots],
  )

  const foundChatSession = useCallback(
    (chatSessionId: string | undefined) =>
      chatSessionId
        ? ADS.isFulfilled(chatSessions)
          ? chatSessions.value.find((cs) => cs.id === chatSessionId) || null
          : null
        : null,
    [chatSessions],
  )

  const getClosestParentPath = useCallback((): string => {
    const organizationId = urlOrganizationId
    const projectId = urlProjectId
    const chatBotId = urlChatBotId
    const chatSessionId = urlChatSessionId

    const organizationFound = foundOrganization(organizationId)
    const projectFound = foundProject(projectId)
    const chatBotFound = foundChatBot(chatBotId)
    const chatSessionFound = foundChatSession(chatSessionId)

    const organizationPath = organizationFound
      ? buildOrganizationPath({
          organizationId: organizationFound.id,
          isAdminInterface,
        })
      : RouteNames.HOME

    const projectPath =
      organizationFound && projectFound
        ? buildProjectPath({
            organizationId: organizationFound.id,
            projectId: projectFound.id,
            isAdminInterface,
          })
        : organizationPath

    const chatBotPath =
      organizationFound && projectFound && chatBotFound
        ? buildChatBotPath({
            organizationId: organizationFound.id,
            projectId: projectFound.id,
            chatBotId: chatBotFound.id,
            isAdminInterface,
          })
        : projectPath

    const chatSessionPath =
      organizationFound && projectFound && chatBotFound && chatSessionFound
        ? buildChatSessionPath({
            organizationId: organizationFound.id,
            projectId: projectFound.id,
            chatBotId: chatBotFound.id,
            chatSessionId: chatSessionFound.id,
            isAdminInterface,
          })
        : chatBotPath

    // closestParent
    return chatSessionPath || chatBotPath || projectPath || organizationPath || RouteNames.HOME
  }, [
    isAdminInterface,
    foundChatBot,
    foundChatSession,
    foundOrganization,
    foundProject,
    urlChatBotId,
    urlChatSessionId,
    urlOrganizationId,
    urlProjectId,
  ])

  return { getClosestParentPath }
}

const buildOrganizationPath = ({
  organizationId,
  isAdminInterface,
}: {
  organizationId: string
  isAdminInterface: boolean
}) => {
  const path = `/o/${organizationId}/`
  if (isAdminInterface) return buildAdminPath(path)
  return buildAppPath(path)
}

const buildProjectPath = ({
  organizationId,
  projectId,
  isAdminInterface,
}: {
  organizationId: string
  projectId: string
  isAdminInterface: boolean
}) => {
  const path = `/o/${organizationId}/p/${projectId}`
  if (isAdminInterface) return buildAdminPath(path)
  return buildAppPath(path)
}

const buildChatBotPath = ({
  organizationId,
  projectId,
  chatBotId,
  isAdminInterface,
}: {
  organizationId: string
  projectId: string
  chatBotId: string
  isAdminInterface: boolean
}) => {
  const path = `/o/${organizationId}/p/${projectId}/cb/${chatBotId}`
  if (isAdminInterface) return buildAdminPath(path)
  return buildAppPath(path)
}

const buildChatSessionPath = ({
  organizationId,
  projectId,
  chatBotId,
  chatSessionId,
  isAdminInterface,
}: {
  organizationId: string
  projectId: string
  chatBotId: string
  chatSessionId: string
  isAdminInterface: boolean
}) => {
  const path = `/o/${organizationId}/p/${projectId}/cb/${chatBotId}/cs/${chatSessionId}`
  if (isAdminInterface) return buildAdminPath(path)
  return buildAppPath(path)
}
