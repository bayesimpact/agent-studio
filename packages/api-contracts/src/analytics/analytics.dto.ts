import type { TimeType } from "../generic"

export type AnalyticsDateRangeRequestDto = {
  startAt: TimeType
  endAt: TimeType
}

export type ProjectAnalyticsRequestDto = AnalyticsDateRangeRequestDto & {
  agentId?: string
}

export type AnalyticsDailyPointDto = {
  date: string
  value: number
}
