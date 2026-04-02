import { AnalyticsRoutes } from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { IAnalyticsSpi } from "../analytics.spi"

function dateRangeBody(
  startAt: number,
  endAt: number,
): { payload: { startAt: number; endAt: number } } {
  return { payload: { startAt, endAt } }
}

export default {
  getConversationsPerDay: async ({ organizationId, projectId, startAt, endAt }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof AnalyticsRoutes.getConversationsPerDay.response>(
      AnalyticsRoutes.getConversationsPerDay.getPath({ organizationId, projectId }),
      { data: dateRangeBody(startAt, endAt) },
    )
    return response.data.data
  },
  getAvgUserQuestionsPerSessionPerDay: async ({ organizationId, projectId, startAt, endAt }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<
      typeof AnalyticsRoutes.getAvgUserQuestionsPerSessionPerDay.response
    >(AnalyticsRoutes.getAvgUserQuestionsPerSessionPerDay.getPath({ organizationId, projectId }), {
      data: dateRangeBody(startAt, endAt),
    })
    return response.data.data
  },
} satisfies IAnalyticsSpi
