import { useCallback } from "react"
import { useParams } from "react-router-dom"
import { selectAgentsData } from "@/features/agents/agents.selectors"
import { selectCurrentConversationAgentSessionsData } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.selectors"
import { selectOrganizationsData } from "@/features/organizations/organizations.selectors"
import { selectProjectsData } from "@/features/projects/projects.selectors"
import { buildAppPath, buildStudioPath, RouteNames } from "@/routes/helpers"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { useAbility } from "./use-ability"

export type PathType = "organization" | "project" | "agent" | "agentSession"

export interface BuildPathOptions {
  organizationId?: string
  projectId?: string
  agentId?: string
  agentSessionId?: string
}

export function useGetPath() {
  const { isAdminInterface } = useAbility()
  const {
    organizationId: urlOrganizationId,
    projectId: urlProjectId,
    agentId: urlagentId,
    agentSessionId: urlagentSessionId,
  } = useParams()

  const computePath = (isAdminInterface: boolean, pathType: PathType): string => {
    const organizationId = urlOrganizationId
    const projectId = urlProjectId
    const agentId = urlagentId
    const agentSessionId = urlagentSessionId

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

    const agentPath =
      organizationId && projectId && agentId
        ? buildAgentPath({
            organizationId,
            projectId,
            agentId,
            isAdminInterface,
          })
        : projectPath

    if (pathType === "agent") {
      return agentPath
    }

    const agentSessionPath =
      organizationId && projectId && agentId && agentSessionId
        ? buildAgentSessionPath({
            organizationId,
            projectId,
            agentId,
            agentSessionId,
            isAdminInterface,
          })
        : agentPath

    if (pathType === "agentSession") {
      return agentSessionPath
    }

    return RouteNames.HOME
  }

  function getPath(
    pathType: PathType,
    options?: { forceInterface: RouteNames.STUDIO | RouteNames.APP },
  ): string {
    const interfaceToUse = options?.forceInterface
      ? options.forceInterface === RouteNames.STUDIO
      : isAdminInterface
    return computePath(interfaceToUse, pathType)
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
    const agentId = options.agentId
    const agentSessionId = options.agentSessionId

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

    const agentPath =
      organizationId && projectId && agentId
        ? buildAgentPath({
            organizationId,
            projectId,
            agentId,
            isAdminInterface,
          })
        : projectPath

    if (pathType === "agent") {
      return agentPath
    }

    const agentSessionPath =
      organizationId && projectId && agentId && agentSessionId
        ? buildAgentSessionPath({
            organizationId,
            projectId,
            agentId,
            agentSessionId,
            isAdminInterface,
          })
        : agentPath

    if (pathType === "agentSession") {
      return agentSessionPath
    }

    return RouteNames.HOME
  }

  const buildPath: {
    (
      pathType: "agentSession",
      options: {
        organizationId: string
        projectId: string
        agentId: string
        agentSessionId: string
      },
    ): string
    (
      pathType: "agent",
      options: { organizationId: string; projectId: string; agentId: string },
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
    agentId: urlagentId,
    agentSessionId: urlagentSessionId,
  } = useParams()
  const organizations = useAppSelector(selectOrganizationsData)
  const projects = useAppSelector(selectProjectsData)
  const agents = useAppSelector(selectAgentsData)
  const agentSessions = useAppSelector(selectCurrentConversationAgentSessionsData)

  const foundOrganization = useCallback(
    (organizationId: string | undefined) =>
      organizationId
        ? ADS.isFulfilled(organizations)
          ? organizations.value.find((org) => org.id === organizationId) || null
          : null
        : null,
    [organizations],
  )

  const foundProject = useCallback(
    (projectId: string | undefined) =>
      projectId
        ? ADS.isFulfilled(projects)
          ? projects.value.find((proj) => proj.id === projectId) || null
          : null
        : null,
    [projects],
  )

  const foundagent = useCallback(
    (agentId: string | undefined) =>
      agentId
        ? ADS.isFulfilled(agents)
          ? agents.value.find((cb) => cb.id === agentId) || null
          : null
        : null,
    [agents],
  )

  const foundagentSession = useCallback(
    (agentSessionId: string | undefined) =>
      agentSessionId
        ? ADS.isFulfilled(agentSessions)
          ? agentSessions.value.find((cs) => cs.id === agentSessionId) || null
          : null
        : null,
    [agentSessions],
  )

  const getClosestParentPath = useCallback((): string => {
    const organizationId = urlOrganizationId
    const projectId = urlProjectId
    const agentId = urlagentId
    const agentSessionId = urlagentSessionId

    const organizationFound = foundOrganization(organizationId)
    const projectFound = foundProject(projectId)
    const agentFound = foundagent(agentId)
    const agentSessionFound = foundagentSession(agentSessionId)

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

    const agentPath =
      organizationFound && projectFound && agentFound
        ? buildAgentPath({
            organizationId: organizationFound.id,
            projectId: projectFound.id,
            agentId: agentFound.id,
            isAdminInterface,
          })
        : projectPath

    const agentSessionPath =
      organizationFound && projectFound && agentFound && agentSessionFound
        ? buildAgentSessionPath({
            organizationId: organizationFound.id,
            projectId: projectFound.id,
            agentId: agentFound.id,
            agentSessionId: agentSessionFound.id,
            isAdminInterface,
          })
        : agentPath

    // closestParent
    return agentSessionPath || agentPath || projectPath || organizationPath || RouteNames.HOME
  }, [
    isAdminInterface,
    foundagent,
    foundagentSession,
    foundOrganization,
    foundProject,
    urlagentId,
    urlagentSessionId,
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
  if (isAdminInterface) return buildStudioPath(path)
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
  if (isAdminInterface) return buildStudioPath(path)
  return buildAppPath(path)
}

const buildAgentPath = ({
  organizationId,
  projectId,
  agentId,
  isAdminInterface,
}: {
  organizationId: string
  projectId: string
  agentId: string
  isAdminInterface: boolean
}) => {
  const path = `/o/${organizationId}/p/${projectId}/a/${agentId}`
  if (isAdminInterface) return buildStudioPath(path)
  return buildAppPath(path)
}

const buildAgentSessionPath = ({
  organizationId,
  projectId,
  agentId,
  agentSessionId,
  isAdminInterface,
}: {
  organizationId: string
  projectId: string
  agentId: string
  agentSessionId: string
  isAdminInterface: boolean
}) => {
  const path = `/o/${organizationId}/p/${projectId}/a/${agentId}/as/${agentSessionId}`
  if (isAdminInterface) return buildStudioPath(path)
  return buildAppPath(path)
}
