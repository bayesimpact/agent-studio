import type { RequestPayload, ResponseData } from "../generic"
import { defineRoute } from "../helpers"
import type { AnalyticsDailyPointDto, AnalyticsDateRangeRequestDto } from "./analytics.dto"

export const AnalyticsRoutes = {
  getConversationsPerDay: defineRoute<
    ResponseData<AnalyticsDailyPointDto[]>,
    RequestPayload<AnalyticsDateRangeRequestDto>
  >({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/analytics/conversations-per-day",
  }),

  getAvgUserQuestionsPerSessionPerDay: defineRoute<
    ResponseData<AnalyticsDailyPointDto[]>,
    RequestPayload<AnalyticsDateRangeRequestDto>
  >({
    method: "get",
    path: "organizations/:organizationId/projects/:projectId/analytics/avg-user-questions-per-session-per-day",
  }),
}
