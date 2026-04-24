export enum StudioRouteNames {
  // STUDIO ROUTES
  APP = "/studio",
  DOCUMENTS = "/o/:organizationId/p/:projectId/d",
  DOCUMENT = "/o/:organizationId/p/:projectId/d/:documentId",
  PROJECT_ANALYTICS = "/o/:organizationId/p/:projectId/analytics",
  EVALUATION = "/o/:organizationId/p/:projectId/eval",
  PROJECT_MEMBERSHIPS = "/o/:organizationId/p/:projectId/members",
  FEEDBACK = "/o/:organizationId/p/:projectId/a/:agentId/f",
  AGENT_MEMBERSHIPS = "/o/:organizationId/p/:projectId/a/:agentId/members",
  AGENT_ANALYTICS = "/o/:organizationId/p/:projectId/a/:agentId/analytics",
  REVIEW_CAMPAIGNS = "/o/:organizationId/p/:projectId/review-campaigns",
}

export enum TesterRouteNames {
  HOME = "/tester",
  CAMPAIGN = "/tester/o/:organizationId/p/:projectId/review-campaigns/:reviewCampaignId",
  SURVEY = "/tester/o/:organizationId/p/:projectId/review-campaigns/:reviewCampaignId/survey",
  SESSION = "/tester/o/:organizationId/p/:projectId/review-campaigns/:reviewCampaignId/a/:agentId/as/:agentSessionId",
}

export enum ReviewerRouteNames {
  HOME = "/reviewer",
  CAMPAIGN = "/reviewer/o/:organizationId/p/:projectId/review-campaigns/:reviewCampaignId",
  SESSION = "/reviewer/o/:organizationId/p/:projectId/review-campaigns/:reviewCampaignId/sessions/:sessionId",
}

export const buildStudioPath = (path: string) => {
  return `${StudioRouteNames.APP}${path}`
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

export const buildProjectAnalyticsPath = ({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) => {
  return buildStudioPath(
    StudioRouteNames.PROJECT_ANALYTICS.replace(":organizationId", organizationId).replace(
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

export const buildAgentAnalyticsPath = ({
  organizationId,
  projectId,
  agentId,
}: {
  organizationId: string
  projectId: string
  agentId: string
}) => {
  return buildStudioPath(
    StudioRouteNames.AGENT_ANALYTICS.replace(":organizationId", organizationId)
      .replace(":projectId", projectId)
      .replace(":agentId", agentId),
  )
}

export const buildReviewCampaignsPath = ({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) => {
  return buildStudioPath(
    StudioRouteNames.REVIEW_CAMPAIGNS.replace(":organizationId", organizationId).replace(
      ":projectId",
      projectId,
    ),
  )
}

export const buildTesterHomePath = () => TesterRouteNames.HOME

export const buildTesterCampaignPath = ({
  organizationId,
  projectId,
  reviewCampaignId,
}: {
  organizationId: string
  projectId: string
  reviewCampaignId: string
}) =>
  TesterRouteNames.CAMPAIGN.replace(":organizationId", organizationId)
    .replace(":projectId", projectId)
    .replace(":reviewCampaignId", reviewCampaignId)

export const buildTesterSurveyPath = ({
  organizationId,
  projectId,
  reviewCampaignId,
}: {
  organizationId: string
  projectId: string
  reviewCampaignId: string
}) =>
  TesterRouteNames.SURVEY.replace(":organizationId", organizationId)
    .replace(":projectId", projectId)
    .replace(":reviewCampaignId", reviewCampaignId)

export const buildTesterSessionPath = ({
  organizationId,
  projectId,
  reviewCampaignId,
  agentId,
  agentSessionId,
}: {
  organizationId: string
  projectId: string
  reviewCampaignId: string
  agentId: string
  agentSessionId: string
}) =>
  TesterRouteNames.SESSION.replace(":organizationId", organizationId)
    .replace(":projectId", projectId)
    .replace(":reviewCampaignId", reviewCampaignId)
    .replace(":agentId", agentId)
    .replace(":agentSessionId", agentSessionId)

export const buildReviewerHomePath = () => ReviewerRouteNames.HOME

export const buildReviewerCampaignPath = ({
  organizationId,
  projectId,
  reviewCampaignId,
}: {
  organizationId: string
  projectId: string
  reviewCampaignId: string
}) =>
  ReviewerRouteNames.CAMPAIGN.replace(":organizationId", organizationId)
    .replace(":projectId", projectId)
    .replace(":reviewCampaignId", reviewCampaignId)

export const buildReviewerSessionPath = ({
  organizationId,
  projectId,
  reviewCampaignId,
  sessionId,
}: {
  organizationId: string
  projectId: string
  reviewCampaignId: string
  sessionId: string
}) =>
  ReviewerRouteNames.SESSION.replace(":organizationId", organizationId)
    .replace(":projectId", projectId)
    .replace(":reviewCampaignId", reviewCampaignId)
    .replace(":sessionId", sessionId)

export const isStudioInterface = () => window.location.pathname.startsWith(StudioRouteNames.APP)
