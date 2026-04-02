import type { AnalyticsDailyPoint } from "./projects-analytics.types"

export function toAnalyticsDailyPointDto(
  points: AnalyticsDailyPoint[],
): Array<{ date: string; value: number }> {
  return points.map((point) => ({
    date: point.date,
    value: point.value,
  }))
}
