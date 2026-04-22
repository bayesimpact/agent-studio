import type { AnalyticsCategoryDailyPoint, AnalyticsDailyPoint } from "./analytics.models"

export type ProjectAnalyticsParams = {
  organizationId: string
  projectId: string
  startAt: number
  endAt: number
  agentId?: string
}

export interface IProjectAnalyticsSpi {
  getConversationsPerDay(params: ProjectAnalyticsParams): Promise<AnalyticsDailyPoint[]>
  getAvgUserQuestionsPerSessionPerDay(
    params: ProjectAnalyticsParams,
  ): Promise<AnalyticsDailyPoint[]>
  getConversationsByCategoryPerAgentPerDay(
    params: ProjectAnalyticsParams & { agentId: string },
  ): Promise<AnalyticsCategoryDailyPoint[]>
}
