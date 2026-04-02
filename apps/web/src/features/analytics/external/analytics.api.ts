import { type AnalyticsDailyPointDto, AnalyticsRoutes } from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { AnalyticsDailyPoint } from "../analytics.models"
import type { IAnalyticsSpi } from "../analytics.spi"

export default {
  getConversationsPerDay: async ({ organizationId, projectId, startAt, endAt }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof AnalyticsRoutes.getConversationsPerDay.response>(
      AnalyticsRoutes.getConversationsPerDay.getPath({ organizationId, projectId }),
      dateRangeQueryParams(startAt, endAt),
    )
    return toAnalyticsDailyPoints(response.data.data)
  },
  getAvgUserQuestionsPerSessionPerDay: async ({ organizationId, projectId, startAt, endAt }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<
      typeof AnalyticsRoutes.getAvgUserQuestionsPerSessionPerDay.response
    >(
      AnalyticsRoutes.getAvgUserQuestionsPerSessionPerDay.getPath({ organizationId, projectId }),
      dateRangeQueryParams(startAt, endAt),
    )
    return toAnalyticsDailyPoints(response.data.data)
  },
} satisfies IAnalyticsSpi

function dateRangeQueryParams(startAt: number, endAt: number) {
  return { params: { startAt, endAt } }
}

function toAnalyticsDailyPoints(dtos: AnalyticsDailyPointDto[]): AnalyticsDailyPoint[] {
  return dtos.map((dto) => ({
    date: dto.date,
    value: dto.value,
  }))
}
