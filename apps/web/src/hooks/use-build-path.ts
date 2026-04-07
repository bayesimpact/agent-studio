import { useCallback } from "react"
import { useParams } from "react-router-dom"
import { RouteNames } from "@/common/routes/helpers"
import { buildDeskPath } from "@/desk/routes/helpers"
import { selectAgentsData } from "@/features/agents/agents.selectors"
import { selectCurrentConversationAgentSessionsData } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.selectors"
import { selectOrganizationsData } from "@/features/organizations/organizations.selectors"
import { selectProjectsData } from "@/features/projects/projects.selectors"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { buildStudioPath, isStudioInterface } from "@/studio/routes/helpers"

export type PathType = "organization" | "project" | "agent" | "agentSession"

export interface BuildPathOptions {
  organizationId?: string
  projectId?: string
  agentId?: string
  agentSessionId?: string
}

export const buildOrganizationPath = ({
  organizationId,
  isStudioInterface,
}: {
  organizationId: string
  isStudioInterface: boolean
}) => {
  const path = `/o/${organizationId}/`
  if (isStudioInterface) return buildStudioPath(path)
  return buildDeskPath(path)
}

export const buildProjectPath = ({
  organizationId,
  projectId,
  isStudioInterface,
}: {
  organizationId: string
  projectId: string
  isStudioInterface: boolean
}) => {
  const path = `/o/${organizationId}/p/${projectId}`
  if (isStudioInterface) return buildStudioPath(path)
  return buildDeskPath(path)
}

export const buildAgentPath = ({
  organizationId,
  projectId,
  agentId,
  isStudioInterface,
}: {
  organizationId: string
  projectId: string
  agentId: string
  isStudioInterface: boolean
}) => {
  const path = `/o/${organizationId}/p/${projectId}/a/${agentId}`
  if (isStudioInterface) return buildStudioPath(path)
  return buildDeskPath(path)
}

export const buildAgentSessionPath = ({
  organizationId,
  projectId,
  agentId,
  agentSessionId,
  isStudioInterface,
}: {
  organizationId: string
  projectId: string
  agentId: string
  agentSessionId: string
  isStudioInterface: boolean
}) => {
  const path = `/o/${organizationId}/p/${projectId}/a/${agentId}/as/${agentSessionId}`
  if (isStudioInterface) return buildStudioPath(path)
  return buildDeskPath(path)
}

export function useClosestParentPath() {
  const isStudio = isStudioInterface()
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
          isStudioInterface: isStudio,
        })
      : RouteNames.HOME

    const projectPath =
      organizationFound && projectFound
        ? buildProjectPath({
            organizationId: organizationFound.id,
            projectId: projectFound.id,
            isStudioInterface: isStudio,
          })
        : organizationPath

    const agentPath =
      organizationFound && projectFound && agentFound
        ? buildAgentPath({
            organizationId: organizationFound.id,
            projectId: projectFound.id,
            agentId: agentFound.id,
            isStudioInterface: isStudio,
          })
        : projectPath

    const agentSessionPath =
      organizationFound && projectFound && agentFound && agentSessionFound
        ? buildAgentSessionPath({
            organizationId: organizationFound.id,
            projectId: projectFound.id,
            agentId: agentFound.id,
            agentSessionId: agentSessionFound.id,
            isStudioInterface: isStudio,
          })
        : agentPath

    // closestParent
    return agentSessionPath || agentPath || projectPath || organizationPath || RouteNames.HOME
  }, [
    isStudio,
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
