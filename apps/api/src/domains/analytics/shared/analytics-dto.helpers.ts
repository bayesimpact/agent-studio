import type { AnalyticsCategoryDailyPoint, AnalyticsDailyPoint } from "./analytics-metrics.types"

export function toAnalyticsDailyPointDto(
  points: AnalyticsDailyPoint[],
): Array<{ date: string; value: number }> {
  return points.map((point) => ({
    date: point.date,
    value: point.value,
  }))
}

export function toAnalyticsCategoryDailyPointDto(points: AnalyticsCategoryDailyPoint[]): Array<{
  date: string
  agentId: string
  agentName: string
  categoryId?: string
  categoryName: string
  value: number
  isUncategorized: boolean
}> {
  return points.map((point) => ({
    date: point.date,
    agentId: point.agentId,
    agentName: point.agentName,
    ...(point.categoryId ? { categoryId: point.categoryId } : {}),
    categoryName: point.categoryName,
    value: point.value,
    isUncategorized: point.isUncategorized,
  }))
}
