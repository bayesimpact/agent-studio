import type { RootState } from "@/common/store"
import type { AsyncData } from "@/common/store/async-data-status"
import type { AnalyticsDailyPoint } from "../project/analytics.models"

export const selectAgentAnalyticsConversationsPerDay = (
  state: RootState,
): AsyncData<AnalyticsDailyPoint[]> => state.studio.agentAnalytics.conversationsPerDay

export const selectAgentAnalyticsAvgUserQuestionsPerSessionPerDay = (
  state: RootState,
): AsyncData<AnalyticsDailyPoint[]> => state.studio.agentAnalytics.avgUserQuestionsPerSessionPerDay
