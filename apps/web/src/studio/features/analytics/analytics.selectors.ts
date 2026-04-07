import type { RootState } from "@/store"
import type { AsyncData } from "@/store/async-data-status"
import type { AnalyticsDailyPoint } from "./analytics.models"

export const selectAnalyticsConversationsPerDay = (
  state: RootState,
): AsyncData<AnalyticsDailyPoint[]> => state.studio.analytics.conversationsPerDay

export const selectAnalyticsAvgUserQuestionsPerSessionPerDay = (
  state: RootState,
): AsyncData<AnalyticsDailyPoint[]> => state.studio.analytics.avgUserQuestionsPerSessionPerDay
