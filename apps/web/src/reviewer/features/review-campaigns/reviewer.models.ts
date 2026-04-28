import type {
  GetReviewerSessionResponseDto,
  ListMyReviewCampaignsResponseDto,
  ReviewerSessionListItemDto,
  ReviewerSessionReviewDto,
  SubmitReviewerSessionReviewRequestDto,
  UpdateReviewerSessionReviewRequestDto,
} from "@caseai-connect/api-contracts"

export type MyReviewerCampaign = ListMyReviewCampaignsResponseDto["reviewCampaigns"][number]
export type ReviewerSessionListItem = ReviewerSessionListItemDto
export type ReviewerSessionDetail = GetReviewerSessionResponseDto
export type ReviewerSessionReview = ReviewerSessionReviewDto

export type { SubmitReviewerSessionReviewRequestDto as SubmitReviewerReviewFields }
export type { UpdateReviewerSessionReviewRequestDto as UpdateReviewerReviewFields }
