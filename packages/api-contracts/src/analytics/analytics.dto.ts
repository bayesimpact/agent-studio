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

export type AnalyticsCategoryDailyPointDto = {
  date: string
  agentId: string
  agentName: string
  categoryId?: string
  categoryName: string
  value: number
  isUncategorized: boolean
}
