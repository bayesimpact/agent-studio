import { useParams } from "react-router-dom"
import { RouteNames } from "@/common/routes/helpers"
import {
  type BuildPathOptions,
  buildAgentPath,
  buildAgentSessionPath,
  buildOrganizationPath,
  buildProjectPath,
  type PathType,
} from "@/hooks/use-build-path"

export function useDeskGetPath() {
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
          isStudioInterface: false,
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
            isStudioInterface: false,
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
            isStudioInterface: false,
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
            isStudioInterface: false,
          })
        : agentPath

    if (pathType === "agentSession") {
      return agentSessionPath
    }

    return RouteNames.HOME
  }

  function getDeskPath(pathType: PathType): string {
    return computePath(pathType)
  }

  return { getDeskPath }
}

export function useBuildDeskPath() {
  const computePath = (pathType: PathType, options: BuildPathOptions): string => {
    const organizationId = options.organizationId
    const projectId = options.projectId
    const agentId = options.agentId
    const agentSessionId = options.agentSessionId

    const organizationPath = organizationId
      ? buildOrganizationPath({
          organizationId,
          isStudioInterface: false,
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
            isStudioInterface: false,
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
            isStudioInterface: false,
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
            isStudioInterface: false,
          })
        : agentPath

    if (pathType === "agentSession") {
      return agentSessionPath
    }

    return RouteNames.HOME
  }

  const buildDeskPath: {
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

  return { buildDeskPath }
}
