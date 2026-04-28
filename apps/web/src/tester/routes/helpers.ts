export enum TesterRouteNames {
  HOME = "/tester",
  CAMPAIGN = "/tester/o/:organizationId/p/:projectId/review-campaigns/:reviewCampaignId",
  SURVEY = "/tester/o/:organizationId/p/:projectId/review-campaigns/:reviewCampaignId/survey",
  SESSION = "/tester/o/:organizationId/p/:projectId/review-campaigns/:reviewCampaignId/a/:agentId/as/:agentSessionId",
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
