import type { AnalyticsDailyPoint } from "./analytics.models"

export interface IAnalyticsSpi {
  getConversationsPerDay(params: {
    organizationId: string
    projectId: string
    startAt: number
    endAt: number
  }): Promise<AnalyticsDailyPoint[]>
  getAvgUserQuestionsPerSessionPerDay(params: {
    organizationId: string
    projectId: string
    startAt: number
    endAt: number
  }): Promise<AnalyticsDailyPoint[]>
}
