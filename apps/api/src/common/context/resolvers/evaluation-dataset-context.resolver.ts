import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { EvaluationDataset } from "@/domains/evaluations/datasets/evaluation-dataset.entity"
import type { ContextResolver, ResolvableRequest } from "../context-resolver.interface"
import type {
  EndpointRequestWithEvaluationDataset,
  EndpointRequestWithProject,
} from "../request.interface"

@Injectable()
export class EvaluationDatasetContextResolver implements ContextResolver {
  readonly resource = "evaluationDataset" as const

  constructor(
    @InjectRepository(EvaluationDataset)
    private readonly evaluationDatasetRepository: Repository<EvaluationDataset>,
  ) {}

  async resolve(request: ResolvableRequest): Promise<void> {
    const requestWithParams = request as ResolvableRequest & {
      params: { evaluationDatasetId?: string }
    }
    const evaluationDatasetId = requestWithParams.params?.evaluationDatasetId

    if (!evaluationDatasetId || evaluationDatasetId === ":evaluationDatasetId")
      throw new NotFoundException()

    const requestWithProject = request as EndpointRequestWithProject
    const evaluationDataset =
      (await this.evaluationDatasetRepository.findOne({
        where: {
          id: evaluationDatasetId,
          organizationId: requestWithProject.organizationId,
          projectId: requestWithProject.project.id,
        },
      })) ?? undefined
    if (!evaluationDataset) throw new NotFoundException()

    const requestWithEvaluationDataset = request as EndpointRequestWithEvaluationDataset
    requestWithEvaluationDataset.evaluationDataset = evaluationDataset
  }
}
