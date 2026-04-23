export type ReviewCampaignStatus = "draft" | "active" | "closed"

export type ReviewCampaignMembershipRole = "tester" | "reviewer"

export type ReviewCampaignSessionType = "conversation" | "extraction" | "form"

export type ReviewCampaignQuestionType = "rating" | "single-choice" | "free-text"

export type ReviewCampaignQuestion = {
  id: string
  prompt: string
  type: ReviewCampaignQuestionType
  required: boolean
  options?: string[]
}

export type ReviewCampaignAnswer = {
  questionId: string
  value: string | number | string[]
}
