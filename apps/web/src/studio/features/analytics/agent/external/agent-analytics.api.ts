import { AgentAnalyticsRoutes, type AnalyticsDailyPointDto } from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { AnalyticsDailyPoint } from "../../project/analytics.models"
import type { IAgentAnalyticsSpi } from "../agent-analytics.spi"

export default {
  getConversationsPerDay: async ({ organizationId, projectId, agentId, startAt, endAt }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof AgentAnalyticsRoutes.getConversationsPerDay.response>(
      AgentAnalyticsRoutes.getConversationsPerDay.getPath({
        organizationId,
        projectId,
        agentId,
      }),
      dateRangeQueryParams(startAt, endAt),
    )
    return toAnalyticsDailyPoints(response.data.data)
  },
  getAvgUserQuestionsPerSessionPerDay: async ({
    organizationId,
    projectId,
    agentId,
    startAt,
    endAt,
  }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<
      typeof AgentAnalyticsRoutes.getAvgUserQuestionsPerSessionPerDay.response
    >(
      AgentAnalyticsRoutes.getAvgUserQuestionsPerSessionPerDay.getPath({
        organizationId,
        projectId,
        agentId,
      }),
      dateRangeQueryParams(startAt, endAt),
    )
    return toAnalyticsDailyPoints(response.data.data)
  },
} satisfies IAgentAnalyticsSpi

function dateRangeQueryParams(startAt: number, endAt: number) {
  return { params: { startAt, endAt } }
}

function toAnalyticsDailyPoints(dtos: AnalyticsDailyPointDto[]): AnalyticsDailyPoint[] {
  return dtos.map((dto) => ({
    date: dto.date,
    value: dto.value,
  }))
}
