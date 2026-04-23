import type { TimeType } from "../generic"

export type ReviewCampaignStatus = "draft" | "active" | "closed"

export type ReviewCampaignMembershipRole = "tester" | "reviewer"

export type ReviewCampaignQuestionType = "rating" | "single-choice" | "free-text"

export type ReviewCampaignQuestionDto = {
  id: string
  prompt: string
  type: ReviewCampaignQuestionType
  required: boolean
  options?: string[]
}

export type ReviewCampaignDto = {
  id: string
  organizationId: string
  projectId: string
  agentId: string
  name: string
  description: string | null
  status: ReviewCampaignStatus
  testerPerSessionQuestions: ReviewCampaignQuestionDto[]
  testerEndOfPhaseQuestions: ReviewCampaignQuestionDto[]
  reviewerQuestions: ReviewCampaignQuestionDto[]
  activatedAt: TimeType | null
  closedAt: TimeType | null
  createdAt: TimeType
  updatedAt: TimeType
}

export type ReviewCampaignMembershipDto = {
  id: string
  campaignId: string
  userId: string
  userEmail: string
  role: ReviewCampaignMembershipRole
  invitedAt: TimeType
  acceptedAt: TimeType | null
}

export type CampaignAggregatesDto = {
  meanTesterRating: number | null
  surveyCount: number
  sessionCount: number
}

export type ReviewCampaignDetailDto = ReviewCampaignDto & {
  memberships: ReviewCampaignMembershipDto[]
  aggregates: CampaignAggregatesDto | null
}

export type CreateReviewCampaignRequestDto = {
  agentId: string
  name: string
  description?: string | null
  testerPerSessionQuestions?: ReviewCampaignQuestionDto[]
  testerEndOfPhaseQuestions?: ReviewCampaignQuestionDto[]
  reviewerQuestions?: ReviewCampaignQuestionDto[]
}

export type UpdateReviewCampaignRequestDto = {
  name?: string
  description?: string | null
  testerPerSessionQuestions?: ReviewCampaignQuestionDto[]
  testerEndOfPhaseQuestions?: ReviewCampaignQuestionDto[]
  reviewerQuestions?: ReviewCampaignQuestionDto[]
  status?: ReviewCampaignStatus
}

export type InviteReviewCampaignMembersRequestDto = {
  role: ReviewCampaignMembershipRole
  emails: string[]
}

export type ListReviewCampaignsResponseDto = {
  reviewCampaigns: ReviewCampaignDto[]
}

export type InviteReviewCampaignMembersResponseDto = {
  memberships: ReviewCampaignMembershipDto[]
}

// === Tester API ===

export type TesterAgentSnapshotDto = {
  id: string
  name: string
  type: "conversation" | "extraction" | "form"
  greetingMessage: string | null
}

export type ReviewCampaignTesterContextDto = {
  id: string
  name: string
  description: string | null
  status: ReviewCampaignStatus
  agent: TesterAgentSnapshotDto
  testerPerSessionQuestions: ReviewCampaignQuestionDto[]
  testerEndOfPhaseQuestions: ReviewCampaignQuestionDto[]
}

export type ListMyReviewCampaignsResponseDto = {
  reviewCampaigns: Array<
    Pick<ReviewCampaignDto, "id" | "name" | "description" | "status" | "agentId" | "createdAt"> & {
      organizationId: string
      projectId: string
    }
  >
}

export type ReviewCampaignTesterFeedbackAnswerDto = {
  questionId: string
  value: string | number | string[]
}

export type TesterSessionFeedbackDto = {
  id: string
  campaignId: string
  sessionId: string
  sessionType: "conversation" | "extraction" | "form"
  overallRating: number
  comment: string | null
  answers: ReviewCampaignTesterFeedbackAnswerDto[]
  createdAt: TimeType
  updatedAt: TimeType
}

export type SubmitTesterSessionFeedbackRequestDto = {
  overallRating: number
  comment?: string | null
  answers?: ReviewCampaignTesterFeedbackAnswerDto[]
}

export type UpdateTesterSessionFeedbackRequestDto = Partial<SubmitTesterSessionFeedbackRequestDto>

export type TesterCampaignSurveyDto = {
  id: string
  campaignId: string
  userId: string
  overallRating: number
  comment: string | null
  answers: ReviewCampaignTesterFeedbackAnswerDto[]
  submittedAt: TimeType
  createdAt: TimeType
  updatedAt: TimeType
}

export type SubmitTesterCampaignSurveyRequestDto = {
  overallRating: number
  comment?: string | null
  answers?: ReviewCampaignTesterFeedbackAnswerDto[]
}

export type UpdateTesterCampaignSurveyRequestDto = Partial<SubmitTesterCampaignSurveyRequestDto>

export type StartTesterSessionRequestDto = {
  type: "playground" | "live"
}

export type StartTesterSessionResponseDto = {
  sessionId: string
  sessionType: "conversation" | "form"
}

export type MyTesterSessionSummaryDto = {
  sessionId: string
  sessionType: "conversation" | "form"
  startedAt: TimeType
  feedbackStatus: "submitted" | "pending"
}

export type ListMyTesterSessionsResponseDto = {
  sessions: MyTesterSessionSummaryDto[]
}

export type GetMyTesterSurveyResponseDto = {
  survey: TesterCampaignSurveyDto | null
}
