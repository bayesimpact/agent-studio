import type { RequestPayload, ResponseData, SuccessResponseDTO } from "../generic"
import { defineRoute } from "../helpers"
import type {
  CreateReviewCampaignRequestDto,
  GetMyTesterSurveyResponseDto,
  GetReviewerSessionResponseDto,
  InviteReviewCampaignMembersRequestDto,
  InviteReviewCampaignMembersResponseDto,
  ListMyReviewCampaignsResponseDto,
  ListMyTesterSessionsResponseDto,
  ListReviewCampaignsResponseDto,
  ListReviewerSessionsResponseDto,
  ReviewCampaignDetailDto,
  ReviewCampaignDto,
  ReviewCampaignTesterContextDto,
  ReviewerSessionReviewDto,
  StartTesterSessionRequestDto,
  StartTesterSessionResponseDto,
  SubmitReviewerSessionReviewRequestDto,
  SubmitTesterCampaignSurveyRequestDto,
  SubmitTesterSessionFeedbackRequestDto,
  TesterCampaignSurveyDto,
  TesterSessionFeedbackDto,
  UpdateReviewCampaignRequestDto,
  UpdateReviewerSessionReviewRequestDto,
  UpdateTesterCampaignSurveyRequestDto,
  UpdateTesterSessionFeedbackRequestDto,
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

  // === Tester API ===

  getMyReviewCampaigns: defineRoute<ResponseData<ListMyReviewCampaignsResponseDto>>({
    method: "get",
    path: "me/review-campaigns",
  }),
  getTesterContext: defineRoute<ResponseData<ReviewCampaignTesterContextDto>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/review-campaigns/:reviewCampaignId/tester-context",
  }),
  startTesterSession: defineRoute<
    ResponseData<StartTesterSessionResponseDto>,
    RequestPayload<StartTesterSessionRequestDto>
  >({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/review-campaigns/:reviewCampaignId/agent-sessions",
  }),
  listMyTesterSessions: defineRoute<ResponseData<ListMyTesterSessionsResponseDto>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/review-campaigns/:reviewCampaignId/my-tester-sessions",
  }),
  submitTesterFeedback: defineRoute<
    ResponseData<TesterSessionFeedbackDto>,
    RequestPayload<SubmitTesterSessionFeedbackRequestDto>
  >({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/agent-sessions/:sessionId/tester-feedback",
  }),
  updateTesterFeedback: defineRoute<
    ResponseData<TesterSessionFeedbackDto>,
    RequestPayload<UpdateTesterSessionFeedbackRequestDto>
  >({
    method: "patch",
    path: "organizations/:organizationId/projects/:projectId/agent-sessions/:sessionId/tester-feedback",
  }),
  submitTesterSurvey: defineRoute<
    ResponseData<TesterCampaignSurveyDto>,
    RequestPayload<SubmitTesterCampaignSurveyRequestDto>
  >({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/review-campaigns/:reviewCampaignId/tester-survey",
  }),
  updateTesterSurvey: defineRoute<
    ResponseData<TesterCampaignSurveyDto>,
    RequestPayload<UpdateTesterCampaignSurveyRequestDto>
  >({
    method: "patch",
    path: "organizations/:organizationId/projects/:projectId/review-campaigns/:reviewCampaignId/tester-survey",
  }),
  getMyTesterSurvey: defineRoute<ResponseData<GetMyTesterSurveyResponseDto>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/review-campaigns/:reviewCampaignId/tester-survey",
  }),
  deleteTesterSession: defineRoute<ResponseData<SuccessResponseDTO>>({
    method: "delete",
    path: "organizations/:organizationId/projects/:projectId/agent-sessions/:sessionId/tester-session",
  }),

  // === Reviewer API ===

  listReviewerSessions: defineRoute<ResponseData<ListReviewerSessionsResponseDto>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/review-campaigns/:reviewCampaignId/reviewer-sessions",
  }),
  getReviewerSession: defineRoute<ResponseData<GetReviewerSessionResponseDto>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/review-campaigns/:reviewCampaignId/agent-sessions/:sessionId/reviewer-view",
  }),
  submitReviewerSessionReview: defineRoute<
    ResponseData<ReviewerSessionReviewDto>,
    RequestPayload<SubmitReviewerSessionReviewRequestDto>
  >({
    method: "post",
    path: "organizations/:organizationId/projects/:projectId/review-campaigns/:reviewCampaignId/agent-sessions/:sessionId/reviewer-reviews",
  }),
  updateReviewerSessionReview: defineRoute<
    ResponseData<ReviewerSessionReviewDto>,
    RequestPayload<UpdateReviewerSessionReviewRequestDto>
  >({
    method: "patch",
    path: "organizations/:organizationId/projects/:projectId/review-campaigns/:reviewCampaignId/agent-sessions/:sessionId/reviewer-reviews/:reviewId",
  }),
}
