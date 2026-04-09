export enum StudioRouteNames {
  // STUDIO ROUTES
  STUDIO = "/studio",
  DOCUMENTS = "/o/:organizationId/p/:projectId/d",
  DOCUMENT = "/o/:organizationId/p/:projectId/d/:documentId",
  ANALYTICS = "/o/:organizationId/p/:projectId/analytics",
  EVALUATION = "/o/:organizationId/p/:projectId/eval",
  PROJECT_MEMBERSHIPS = "/o/:organizationId/p/:projectId/members",
  FEEDBACK = "/o/:organizationId/p/:projectId/a/:agentId/f",
  AGENT_MEMBERSHIPS = "/o/:organizationId/p/:projectId/a/:agentId/members",
}

export const buildStudioPath = (path: string) => {
  return `${StudioRouteNames.STUDIO}${path}`
}

export const buildDocumentsPath = ({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) => {
  return buildStudioPath(
    StudioRouteNames.DOCUMENTS.replace(":organizationId", organizationId).replace(
      ":projectId",
      projectId,
    ),
  )
}

export const buildAnalyticsPath = ({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) => {
  return buildStudioPath(
    StudioRouteNames.ANALYTICS.replace(":organizationId", organizationId).replace(
      ":projectId",
      projectId,
    ),
  )
}

export const buildEvaluationPath = ({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) => {
  return buildStudioPath(
    StudioRouteNames.EVALUATION.replace(":organizationId", organizationId).replace(
      ":projectId",
      projectId,
    ),
  )
}

export const buildFeedbackPath = ({
  organizationId,
  projectId,
  agentId,
}: {
  organizationId: string
  projectId: string
  agentId: string
}) => {
  return buildStudioPath(
    StudioRouteNames.FEEDBACK.replace(":organizationId", organizationId)
      .replace(":projectId", projectId)
      .replace(":agentId", agentId),
  )
}

export const buildProjectMembershipsPath = ({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) => {
  return buildStudioPath(
    StudioRouteNames.PROJECT_MEMBERSHIPS.replace(":organizationId", organizationId).replace(
      ":projectId",
      projectId,
    ),
  )
}

export const buildAgentMembershipsPath = ({
  organizationId,
  projectId,
  agentId,
}: {
  organizationId: string
  projectId: string
  agentId: string
}) => {
  return buildStudioPath(
    StudioRouteNames.AGENT_MEMBERSHIPS.replace(":organizationId", organizationId)
      .replace(":projectId", projectId)
      .replace(":agentId", agentId),
  )
}

export const isStudioInterface = () => window.location.pathname.startsWith(StudioRouteNames.STUDIO)
