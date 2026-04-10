import type { ResponseData } from "../generic"
import { defineRoute } from "../helpers"
import type { AnalyticsDailyPointDto } from "./analytics.dto"

/** Query: `startAt`, `endAt` — Unix ms (see `AnalyticsDateRangeRequestDto`). */
export const AnalyticsRoutes = {
  getConversationsPerDay: defineRoute<ResponseData<AnalyticsDailyPointDto[]>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/analytics/conversations-per-day",
  }),

  getAvgUserQuestionsPerSessionPerDay: defineRoute<ResponseData<AnalyticsDailyPointDto[]>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/analytics/avg-user-questions-per-session-per-day",
  }),
}

/** Per-agent conversation metrics; query: `startAt`, `endAt` — Unix ms. */
export const AgentAnalyticsRoutes = {
  getConversationsPerDay: defineRoute<ResponseData<AnalyticsDailyPointDto[]>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/analytics/conversations-per-day",
  }),

  getAvgUserQuestionsPerSessionPerDay: defineRoute<ResponseData<AnalyticsDailyPointDto[]>>({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/agents/:agentId/analytics/avg-user-questions-per-session-per-day",
  }),
}
