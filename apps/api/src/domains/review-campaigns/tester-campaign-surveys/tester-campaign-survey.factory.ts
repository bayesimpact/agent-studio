import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { RequiredScopeTransientParams } from "@/common/entities/connect-required-fields"
import type { User } from "@/domains/users/user.entity"
import type { ReviewCampaign } from "../review-campaign.entity"
import type { TesterCampaignSurvey } from "./tester-campaign-survey.entity"

type TesterCampaignSurveyTransientParams = RequiredScopeTransientParams & {
  campaign: ReviewCampaign
  user: User
}

class TesterCampaignSurveyFactory extends Factory<
  TesterCampaignSurvey,
  TesterCampaignSurveyTransientParams
> {}

export const testerCampaignSurveyFactory = TesterCampaignSurveyFactory.define(
  ({ params, transientParams }) => {
    if (!transientParams.organization) {
      throw new Error("organization transient is required")
    }
    if (!transientParams.project) {
      throw new Error("project transient is required")
    }
    if (!transientParams.campaign) {
      throw new Error("campaign transient is required")
    }
    if (!transientParams.user) {
      throw new Error("user transient is required")
    }

    const now = new Date()
    return {
      id: params.id || randomUUID(),
      createdAt: params.createdAt || now,
      updatedAt: params.updatedAt || now,
      deletedAt: params.deletedAt ?? null,
      organizationId: transientParams.organization.id,
      projectId: transientParams.project.id,
      campaignId: transientParams.campaign.id,
      campaign: transientParams.campaign,
      userId: transientParams.user.id,
      user: transientParams.user,
      overallRating: params.overallRating ?? 5,
      comment: params.comment ?? null,
      answers: params.answers || [],
      submittedAt: params.submittedAt || now,
    } satisfies TesterCampaignSurvey
  },
)
