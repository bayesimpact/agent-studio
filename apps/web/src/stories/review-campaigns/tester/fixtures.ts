import type {
  ListMyReviewCampaignsResponseDto,
  MyTesterSessionSummaryDto,
  ReviewCampaignQuestionDto,
  ReviewCampaignTesterContextDto,
  TesterCampaignSurveyDto,
} from "@caseai-connect/api-contracts"
import type { TesterSessionSummary } from "@/tester/features/review-campaigns/components/SessionCard"

const MS_PER_HOUR = 3_600_000
const MS_PER_DAY = 86_400_000
const now = Date.now()

export const mockPerSessionQuestions: ReviewCampaignQuestionDto[] = [
  { id: "ps-1", prompt: "Were the agent's answers clear?", type: "rating", required: true },
  {
    id: "ps-2",
    prompt: "Did the agent address your question?",
    type: "single-choice",
    required: true,
    options: ["Yes", "Partially", "No"],
  },
  {
    id: "ps-3",
    prompt: "Anything we should know about this session?",
    type: "free-text",
    required: false,
  },
]

export const mockEndOfPhaseQuestions: ReviewCampaignQuestionDto[] = [
  {
    id: "eop-1",
    prompt: "How satisfied are you with the agent overall?",
    type: "rating",
    required: true,
  },
  {
    id: "eop-2",
    prompt: "Would you recommend this agent to a colleague?",
    type: "single-choice",
    required: false,
    options: ["Definitely", "Maybe", "No"],
  },
  {
    id: "eop-3",
    prompt: "What would most improve the experience?",
    type: "free-text",
    required: false,
  },
]

export const mockTesterContext: ReviewCampaignTesterContextDto = {
  id: "campaign-active",
  name: "Support assistant — first pass",
  description: "Help us evaluate the new support assistant.",
  status: "active",
  agent: {
    id: "agent-1",
    name: "Support assistant",
    type: "conversation",
    greetingMessage: "Hi! Ask me anything about your account.",
  },
  testerPerSessionQuestions: mockPerSessionQuestions,
  testerEndOfPhaseQuestions: mockEndOfPhaseQuestions,
}

export const mockMyCampaigns: ListMyReviewCampaignsResponseDto["reviewCampaigns"] = [
  {
    id: mockTesterContext.id,
    name: mockTesterContext.name,
    description: mockTesterContext.description,
    status: "active",
    agentId: mockTesterContext.agent.id,
    createdAt: now - 3 * MS_PER_DAY,
    organizationId: "org-1",
    projectId: "proj-1",
  },
  {
    id: "campaign-active-2",
    name: "Scheduling bot — sprint 14",
    description: "Two-week rollout evaluation.",
    status: "active",
    agentId: "agent-2",
    createdAt: now - 6 * MS_PER_DAY,
    organizationId: "org-1",
    projectId: "proj-1",
  },
]

export const mockSessions: TesterSessionSummary[] = [
  {
    id: "session-pending",
    startedAt: now - 2 * MS_PER_HOUR,
    feedbackStatus: "pending",
  },
  {
    id: "session-submitted",
    startedAt: now - 1 * MS_PER_DAY,
    feedbackStatus: "submitted",
  },
  {
    id: "session-abandoned",
    startedAt: now - 2 * MS_PER_DAY,
    feedbackStatus: "abandoned",
  },
]

export const mockSessionSummaries: MyTesterSessionSummaryDto[] = mockSessions.map((session) => ({
  sessionId: session.id,
  sessionType: "conversation",
  startedAt: session.startedAt,
  feedbackStatus: session.feedbackStatus === "abandoned" ? "pending" : session.feedbackStatus,
}))

export const mockSurvey: TesterCampaignSurveyDto = {
  id: "survey-mock",
  campaignId: mockTesterContext.id,
  userId: "user-mock",
  overallRating: 4,
  comment: "Overall good",
  answers: [],
  submittedAt: now - MS_PER_HOUR,
  createdAt: now - MS_PER_HOUR,
  updatedAt: now - MS_PER_HOUR,
}
