import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { RequiredScopeTransientParams } from "@/common/entities/connect-required-fields"
import type { ConversationAgentSession } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session.entity"
import type { ExtractionAgentSession } from "@/domains/agents/extraction-agent-sessions/extraction-agent-session.entity"
import type { FormAgentSession } from "@/domains/agents/form-agent-sessions/form-agent-session.entity"
import type { ReviewCampaign } from "../review-campaign.entity"
import type { ReviewCampaignSessionType } from "../review-campaigns.types"
import type { TesterSessionFeedback } from "./tester-session-feedback.entity"

type TesterSessionFeedbackTransientParams = RequiredScopeTransientParams & {
  campaign: ReviewCampaign
  session: ConversationAgentSession | ExtractionAgentSession | FormAgentSession
  sessionType: ReviewCampaignSessionType
}

class TesterSessionFeedbackFactory extends Factory<
  TesterSessionFeedback,
  TesterSessionFeedbackTransientParams
> {}

export const testerSessionFeedbackFactory = TesterSessionFeedbackFactory.define(
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
    if (!transientParams.session) {
      throw new Error("session transient is required")
    }
    if (!transientParams.sessionType) {
      throw new Error("sessionType transient is required")
    }

    const sessionType = transientParams.sessionType
    const conversationAgentSession =
      sessionType === "conversation" ? (transientParams.session as ConversationAgentSession) : null
    const extractionAgentSession =
      sessionType === "extraction" ? (transientParams.session as ExtractionAgentSession) : null
    const formAgentSession =
      sessionType === "form" ? (transientParams.session as FormAgentSession) : null

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
      sessionId: transientParams.session.id,
      sessionType,
      conversationAgentSession,
      extractionAgentSession,
      formAgentSession,
      overallRating: params.overallRating ?? 5,
      comment: params.comment ?? null,
      answers: params.answers || [],
    } satisfies TesterSessionFeedback
  },
)
