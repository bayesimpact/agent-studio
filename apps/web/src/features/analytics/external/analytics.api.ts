import { AnalyticsRoutes } from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { IAnalyticsSpi } from "../analytics.spi"

function dateRangeQueryParams(startAt: number, endAt: number) {
  return { params: { startAt, endAt } }
}

export default {
  getConversationsPerDay: async ({ organizationId, projectId, startAt, endAt }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof AnalyticsRoutes.getConversationsPerDay.response>(
      AnalyticsRoutes.getConversationsPerDay.getPath({ organizationId, projectId }),
      dateRangeQueryParams(startAt, endAt),
    )
    return response.data.data
  },
  getAvgUserQuestionsPerSessionPerDay: async ({ organizationId, projectId, startAt, endAt }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<
      typeof AnalyticsRoutes.getAvgUserQuestionsPerSessionPerDay.response
    >(
      AnalyticsRoutes.getAvgUserQuestionsPerSessionPerDay.getPath({ organizationId, projectId }),
      dateRangeQueryParams(startAt, endAt),
    )
    return response.data.data
  },
} satisfies IAnalyticsSpi
