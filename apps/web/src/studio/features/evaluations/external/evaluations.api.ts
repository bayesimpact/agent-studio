import { type EvaluationDto, EvaluationsRoutes } from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { Evaluation } from "../evaluations.models"
import type { IEvaluationsSpi } from "../evaluations.spi"

export default {
  getAll: async ({ organizationId, projectId }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof EvaluationsRoutes.getAll.response>(
      EvaluationsRoutes.getAll.getPath({ organizationId, projectId }),
    )
    return response.data.data.evaluations.map(fromDto)
  },
  createOne: async ({ organizationId, projectId }, payload) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof EvaluationsRoutes.createOne.response>(
      EvaluationsRoutes.createOne.getPath({ organizationId, projectId }),
      { payload: toCreateDto(payload) },
    )
    return fromDto(response.data.data)
  },
  updateOne: async ({ organizationId, projectId, evaluationId }, payload) => {
    const axios = getAxiosInstance()
    await axios.patch(
      EvaluationsRoutes.updateOne.getPath({ organizationId, projectId, evaluationId }),
      { payload: toUpdateDto(payload) },
    )
  },
  deleteOne: async ({ organizationId, projectId, evaluationId }) => {
    const axios = getAxiosInstance()
    await axios.delete(
      EvaluationsRoutes.deleteOne.getPath({ organizationId, projectId, evaluationId }),
    )
  },
} satisfies IEvaluationsSpi

const toCreateDto = (
  payload: Pick<Evaluation, "input" | "expectedOutput">,
): (typeof EvaluationsRoutes.createOne.request)["payload"] => ({
  input: payload.input,
  expectedOutput: payload.expectedOutput,
})

const toUpdateDto = (
  payload: Partial<Pick<Evaluation, "input" | "expectedOutput">>,
): (typeof EvaluationsRoutes.updateOne.request)["payload"] => ({
  input: payload.input,
  expectedOutput: payload.expectedOutput,
})

const fromDto = (dto: EvaluationDto): Evaluation => ({
  createdAt: dto.createdAt,
  expectedOutput: dto.expectedOutput,
  id: dto.id,
  input: dto.input,
  projectId: dto.projectId,
  updatedAt: dto.updatedAt,
})
