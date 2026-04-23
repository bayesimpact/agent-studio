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

export type ReviewCampaignDetailDto = ReviewCampaignDto & {
  memberships: ReviewCampaignMembershipDto[]
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
