export enum ReviewerRouteNames {
  HOME = "/reviewer",
  CAMPAIGN = "/reviewer/o/:organizationId/p/:projectId/review-campaigns/:reviewCampaignId",
  REPORT = "/reviewer/o/:organizationId/p/:projectId/review-campaigns/:reviewCampaignId/report",
  SESSION = "/reviewer/o/:organizationId/p/:projectId/review-campaigns/:reviewCampaignId/sessions/:sessionId",
}

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

export const buildReviewerReportPath = ({
  organizationId,
  projectId,
  reviewCampaignId,
}: {
  organizationId: string
  projectId: string
  reviewCampaignId: string
}) =>
  ReviewerRouteNames.REPORT.replace(":organizationId", organizationId)
    .replace(":projectId", projectId)
    .replace(":reviewCampaignId", reviewCampaignId)
