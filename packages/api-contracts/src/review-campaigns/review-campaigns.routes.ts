import type { RequestPayload, ResponseData, SuccessResponseDTO } from "../generic"
import { defineRoute } from "../helpers"
import type {
  CreateReviewCampaignRequestDto,
  InviteReviewCampaignMembersRequestDto,
  InviteReviewCampaignMembersResponseDto,
  ListReviewCampaignsResponseDto,
  ReviewCampaignDetailDto,
  ReviewCampaignDto,
  UpdateReviewCampaignRequestDto,
} from "./review-campaigns.dto"

export const ReviewCampaignsRoutes = {
  createOne: defineRoute<
    ResponseData<ReviewCampaignDto>,
    RequestPayload<CreateReviewCampaignRequestDto>
  >({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/review-campaigns",
  }),
  getAll: defineRoute<ResponseData<ListReviewCampaignsResponseDto>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/review-campaigns",
  }),
  getOne: defineRoute<ResponseData<ReviewCampaignDetailDto>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/review-campaigns/:reviewCampaignId",
  }),
  updateOne: defineRoute<
    ResponseData<ReviewCampaignDto>,
    RequestPayload<UpdateReviewCampaignRequestDto>
  >({
    method: "patch",
    path: "organizations/:organizationId/projects/:projectId/review-campaigns/:reviewCampaignId",
  }),
  deleteOne: defineRoute<ResponseData<SuccessResponseDTO>>({
    method: "delete",
    path: "organizations/:organizationId/projects/:projectId/review-campaigns/:reviewCampaignId",
  }),
  inviteMembers: defineRoute<
    ResponseData<InviteReviewCampaignMembersResponseDto>,
    RequestPayload<InviteReviewCampaignMembersRequestDto>
  >({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/review-campaigns/:reviewCampaignId/invitations",
  }),
  revokeMembership: defineRoute<ResponseData<SuccessResponseDTO>>({
    method: "delete",
    path: "organizations/:organizationId/projects/:projectId/review-campaigns/:reviewCampaignId/memberships/:membershipId",
  }),
}
