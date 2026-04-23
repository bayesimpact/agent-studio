export type AnalyticsDailyPoint = { date: string; value: number }

export type AnalyticsCategoryDailyPoint = {
  date: string
  agentId: string
  agentName: string
  categoryId?: string
  categoryName: string
  value: number
  isUncategorized: boolean
}
