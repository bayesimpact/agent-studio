import { useCallback } from "react"
import { useParams } from "react-router-dom"
import { selectOrganizationsData } from "@/common/features/organizations/organizations.selectors"
import { RouteNames } from "@/common/routes/helpers"
import { ADS } from "@/common/store/async-data-status"
import { useAppSelector } from "@/common/store/hooks"
import { DeskRouteNames } from "@/desk/routes/helpers"
import { selectCurrentConversationAgentSessionsData } from "@/features/agents/agent-sessions/conversation/conversation-agent-sessions.selectors"
import { selectAgentsData } from "@/features/agents/agents.selectors"
import { selectProjectsData } from "@/features/projects/projects.selectors"
import { StudioRouteNames } from "@/studio/routes/helpers"

export type PathType = "organization" | "project" | "agent" | "agentSession"

export interface BuildPathOptions {
  organizationId?: string
  projectId?: string
  agentId?: string
  agentSessionId?: string
}

const prefix = window.location.pathname.startsWith(`${StudioRouteNames.STUDIO}/`)
  ? StudioRouteNames.STUDIO
  : window.location.pathname.startsWith(`${StudioRouteNames.STUDIO2}/`)
    ? StudioRouteNames.STUDIO2
    : DeskRouteNames.APP

export const buildOrganizationPath = ({ organizationId }: { organizationId: string }) => {
  const path = `/o/${organizationId}/`
  return `${prefix}${path}`
}

const buildProjectPath = ({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) => {
  const path = `/o/${organizationId}/p/${projectId}`
  return `${prefix}${path}`
}

const buildAgentPath = ({
  organizationId,
  projectId,
  agentId,
}: {
  organizationId: string
  projectId: string
  agentId: string
}) => {
  const path = `/o/${organizationId}/p/${projectId}/a/${agentId}`
  return `${prefix}${path}`
}

const buildAgentSessionPath = ({
  organizationId,
  projectId,
  agentId,
  agentSessionId,
}: {
  organizationId: string
  projectId: string
  agentId: string
  agentSessionId: string
}) => {
  const path = `/o/${organizationId}/p/${projectId}/a/${agentId}/as/${agentSessionId}`
  return `${prefix}${path}`
}

export function useClosestParentPath() {
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
        })
      : RouteNames.HOME

    const projectPath =
      organizationFound && projectFound
        ? buildProjectPath({
            organizationId: organizationFound.id,
            projectId: projectFound.id,
          })
        : organizationPath

    const agentPath =
      organizationFound && projectFound && agentFound
        ? buildAgentPath({
            organizationId: organizationFound.id,
            projectId: projectFound.id,
            agentId: agentFound.id,
          })
        : projectPath

    const agentSessionPath =
      organizationFound && projectFound && agentFound && agentSessionFound
        ? buildAgentSessionPath({
            organizationId: organizationFound.id,
            projectId: projectFound.id,
            agentId: agentFound.id,
            agentSessionId: agentSessionFound.id,
          })
        : agentPath

    // closestParent
    return agentSessionPath || agentPath || projectPath || organizationPath || RouteNames.HOME
  }, [
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

export function useGetPath() {
  const {
    organizationId: urlOrganizationId,
    projectId: urlProjectId,
    agentId: urlagentId,
    agentSessionId: urlagentSessionId,
  } = useParams()

  const computePath = (pathType: PathType): string => {
    const organizationId = urlOrganizationId
    const projectId = urlProjectId
    const agentId = urlagentId
    const agentSessionId = urlagentSessionId

    const organizationPath = organizationId
      ? buildOrganizationPath({
          organizationId,
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
          })
        : agentPath

    if (pathType === "agentSession") {
      return agentSessionPath
    }

    return RouteNames.HOME
  }

  function getPath(pathType: PathType): string {
    return computePath(pathType)
  }

  return { getPath }
}

export function useBuildPath() {
  const computePath = (pathType: PathType, options: BuildPathOptions): string => {
    const organizationId = options.organizationId
    const projectId = options.projectId
    const agentId = options.agentId
    const agentSessionId = options.agentSessionId

    const organizationPath = organizationId
      ? buildOrganizationPath({
          organizationId,
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
    return computePath(pathType, options)
  }

  return { buildPath }
}
