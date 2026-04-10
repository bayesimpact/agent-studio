import type { AnalyticsDailyPoint } from "./analytics-metrics.types"

export function toAnalyticsDailyPointDto(
  points: AnalyticsDailyPoint[],
): Array<{ date: string; value: number }> {
  return points.map((point) => ({
    date: point.date,
    value: point.value,
  }))
}
