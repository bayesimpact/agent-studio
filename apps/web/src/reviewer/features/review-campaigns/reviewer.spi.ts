import type {
  ReviewerCampaign,
  ReviewerSessionDetail,
  ReviewerSessionListItem,
  ReviewerSessionReview,
  SubmitReviewerReviewFields,
  UpdateReviewerReviewFields,
} from "./reviewer.models"

type ProjectScope = { organizationId: string; projectId: string }
type CampaignScope = ProjectScope & { reviewCampaignId: string }
type SessionScope = CampaignScope & { sessionId: string }

export interface IReviewerSpi {
  listMyCampaigns(): Promise<ReviewerCampaign[]>
  listSessions(params: CampaignScope): Promise<ReviewerSessionListItem[]>
  getSession(params: SessionScope): Promise<ReviewerSessionDetail>
  submitReview(
    params: SessionScope,
    payload: SubmitReviewerReviewFields,
  ): Promise<ReviewerSessionReview>
  updateReview(
    params: SessionScope & { reviewId: string },
    payload: UpdateReviewerReviewFields,
  ): Promise<ReviewerSessionReview>
}
