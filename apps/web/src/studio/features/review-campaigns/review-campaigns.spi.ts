import type {
  CreateReviewCampaignRequestDto,
  InviteReviewCampaignMembersRequestDto,
  UpdateReviewCampaignRequestDto,
} from "@caseai-connect/api-contracts"
import type {
  ReviewCampaign,
  ReviewCampaignDetail,
  ReviewCampaignMembership,
} from "./review-campaigns.models"

type ProjectScope = { organizationId: string; projectId: string }
type CampaignScope = ProjectScope & { reviewCampaignId: string }

export interface IReviewCampaignsSpi {
  getAll(params: ProjectScope): Promise<ReviewCampaign[]>

  getOne(params: CampaignScope): Promise<ReviewCampaignDetail>

  createOne(params: ProjectScope, payload: CreateReviewCampaignRequestDto): Promise<ReviewCampaign>

  updateOne(params: CampaignScope, payload: UpdateReviewCampaignRequestDto): Promise<ReviewCampaign>

  deleteOne(params: CampaignScope): Promise<void>

  inviteMembers(
    params: CampaignScope,
    payload: InviteReviewCampaignMembersRequestDto,
  ): Promise<ReviewCampaignMembership[]>

  revokeMembership(params: CampaignScope & { membershipId: string }): Promise<void>
}
