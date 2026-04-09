import { useCallback } from "react"
import { useParams } from "react-router-dom"
import { selectCurrentConversationAgentSessionsData } from "@/common/features/agents/agent-sessions/conversation/conversation-agent-sessions.selectors"
import { selectAgentsData } from "@/common/features/agents/agents.selectors"
import { selectOrganizationsData } from "@/common/features/organizations/organizations.selectors"
import { selectProjectsData } from "@/common/features/projects/projects.selectors"
import { RouteNames } from "@/common/routes/helpers"
import { ADS } from "@/common/store/async-data-status"
import { useAppSelector } from "@/common/store/hooks"
import { DeskRouteNames } from "@/desk/routes/helpers"
import { StudioRouteNames } from "@/studio/routes/helpers"

type PathType = "organization" | "project" | "agent" | "agentSession"

interface BuildPathOptions {
  organizationId?: string
  projectId?: string
  agentId?: string
  agentSessionId?: string
}
type ForceInterface = {
  forceInterface?: StudioRouteNames.STUDIO | DeskRouteNames.APP
}

const getPrefix = ({ forceInterface }: ForceInterface) =>
  forceInterface ||
  (window.location.pathname.startsWith(`${StudioRouteNames.STUDIO}/`)
    ? StudioRouteNames.STUDIO
    : DeskRouteNames.APP)

export const buildOrganizationPath = ({
  organizationId,
  ...props
}: { organizationId: string } & ForceInterface) => {
  const path = `${RouteNames.ORGANIZATION_DASHBOARD.replace(":organizationId", organizationId)}/`
  return `${getPrefix(props)}${path}`
}

const buildProjectPath = ({
  organizationId,
  projectId,
  ...props
}: {
  organizationId: string
  projectId: string
} & ForceInterface) => {
  const path = `${RouteNames.PROJECT.replace(":organizationId", organizationId).replace(":projectId", projectId)}/`
  return `${getPrefix(props)}${path}`
}

const buildAgentPath = ({
  organizationId,
  projectId,
  agentId,
  ...props
}: {
  organizationId: string
  projectId: string
  agentId: string
} & ForceInterface) => {
  const path = `${RouteNames.AGENT.replace(":organizationId", organizationId).replace(":projectId", projectId).replace(":agentId", agentId)}/`
  return `${getPrefix(props)}${path}`
}

const buildAgentSessionPath = ({
  organizationId,
  projectId,
  agentId,
  agentSessionId,
  ...props
}: {
  organizationId: string
  projectId: string
  agentId: string
  agentSessionId: string
} & ForceInterface) => {
  const path = `${RouteNames.AGENT_SESSION.replace(":organizationId", organizationId).replace(":projectId", projectId).replace(":agentId", agentId).replace(":agentSessionId", agentSessionId)}/`
  return `${getPrefix(props)}${path}`
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

  const getClosestParentPath = useCallback(
    (redirectToHome?: boolean): string => {
      const organizationId = urlOrganizationId
      const projectId = urlProjectId
      const agentId = urlagentId
      const agentSessionId = urlagentSessionId

      const organizationFound = foundOrganization(organizationId)
      const projectFound = foundProject(projectId)
      const agentFound = foundagent(agentId)
      const agentSessionFound = foundagentSession(agentSessionId)

      if (redirectToHome) {
        return RouteNames.HOME
      }

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
    },
    [
      foundagent,
      foundagentSession,
      foundOrganization,
      foundProject,
      urlagentId,
      urlagentSessionId,
      urlOrganizationId,
      urlProjectId,
    ],
  )

  return { getClosestParentPath }
}

export function useGetPath() {
  const {
    organizationId: urlOrganizationId,
    projectId: urlProjectId,
    agentId: urlagentId,
    agentSessionId: urlagentSessionId,
  } = useParams()

  const computePath = (pathType: PathType, options?: ForceInterface): string => {
    const organizationId = urlOrganizationId
    const projectId = urlProjectId
    const agentId = urlagentId
    const agentSessionId = urlagentSessionId
    const forceInterface = options?.forceInterface

    const organizationPath = organizationId
      ? buildOrganizationPath({
          organizationId,
          forceInterface,
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
            forceInterface,
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
            forceInterface,
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
            forceInterface,
          })
        : agentPath

    if (pathType === "agentSession") {
      return agentSessionPath
    }

    return RouteNames.HOME
  }

  function getPath(pathType: PathType, options?: ForceInterface): string {
    return computePath(pathType, options)
  }

  return { getPath }
}

export function useBuildPath() {
  const computePath = (pathType: PathType, options: BuildPathOptions & ForceInterface): string => {
    const organizationId = options.organizationId
    const projectId = options.projectId
    const agentId = options.agentId
    const agentSessionId = options.agentSessionId
    const forceInterface = options.forceInterface

    const organizationPath = organizationId
      ? buildOrganizationPath({
          organizationId,
          forceInterface,
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
            forceInterface,
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
            forceInterface,
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
            forceInterface,
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
      } & ForceInterface,
    ): string
    (
      pathType: "agent",
      options: { organizationId: string; projectId: string; agentId: string } & ForceInterface,
    ): string

    (
      pathType: "project",
      options: { organizationId: string; projectId: string } & ForceInterface,
    ): string
    (pathType: "organization", options: { organizationId: string } & ForceInterface): string
  } = (pathType: PathType, options: BuildPathOptions): string => {
    return computePath(pathType, options)
  }

  return { buildPath }
}
