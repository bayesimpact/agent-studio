import { type EvaluationReportDto, EvaluationReportsRoutes } from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { EvaluationReport } from "../evaluation-reports.models"
import type { IEvaluationReportsSpi } from "../evaluation-reports.spi"

export default {
  getAll: async ({ organizationId, projectId, evaluationId }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof EvaluationReportsRoutes.getAll.response>(
      EvaluationReportsRoutes.getAll.getPath({ organizationId, projectId, evaluationId }),
    )
    return response.data.data.map(fromDto)
  },
  createOne: async ({ organizationId, projectId, agentId, evaluationId }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof EvaluationReportsRoutes.createOne.response>(
      EvaluationReportsRoutes.createOne.getPath({
        organizationId,
        projectId,
        agentId,
        evaluationId,
      }),
    )
    return fromDto(response.data.data)
  },
} satisfies IEvaluationReportsSpi

const fromDto = (dto: EvaluationReportDto): EvaluationReport => ({
  id: dto.id,
  evaluationId: dto.evaluationId,
  agentId: dto.agentId,
  traceUrl: dto.traceUrl,
  output: dto.output,
  score: dto.score,
  createdAt: dto.createdAt,
  updatedAt: dto.updatedAt,
})
