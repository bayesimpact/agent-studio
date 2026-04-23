import type { RequestPayload, ResponseData, SuccessResponseDTO } from "../generic"
import { defineRoute } from "../helpers"
import type {
  CreateReviewCampaignRequestDto,
  GetMyTesterSurveyResponseDto,
  InviteReviewCampaignMembersRequestDto,
  InviteReviewCampaignMembersResponseDto,
  ListMyReviewCampaignsResponseDto,
  ListMyTesterSessionsResponseDto,
  ListReviewCampaignsResponseDto,
  ReviewCampaignDetailDto,
  ReviewCampaignDto,
  ReviewCampaignTesterContextDto,
  StartTesterSessionRequestDto,
  StartTesterSessionResponseDto,
  SubmitTesterCampaignSurveyRequestDto,
  SubmitTesterSessionFeedbackRequestDto,
  TesterCampaignSurveyDto,
  TesterSessionFeedbackDto,
  UpdateReviewCampaignRequestDto,
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
}
