import type {
  ReviewCampaignDetailDto,
  ReviewCampaignDto,
  ReviewCampaignListItemDto,
  ReviewCampaignMembershipDto,
  ReviewCampaignMembershipRole,
  ReviewCampaignQuestionDto,
  ReviewCampaignQuestionType,
  ReviewCampaignStatus,
} from "@caseai-connect/api-contracts"

export type ReviewCampaign = ReviewCampaignDto
export type ReviewCampaignListItem = ReviewCampaignListItemDto
export type ReviewCampaignDetail = ReviewCampaignDetailDto
export type ReviewCampaignMembership = ReviewCampaignMembershipDto
export type ReviewCampaignQuestion = ReviewCampaignQuestionDto

export type { ReviewCampaignMembershipRole, ReviewCampaignQuestionType, ReviewCampaignStatus }
