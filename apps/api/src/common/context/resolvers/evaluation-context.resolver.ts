import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { Evaluation } from "@/domains/evaluations/evaluation.entity"
import type { ContextResolver, ResolvableRequest } from "../context-resolver.interface"
import type {
  EndpointRequestWithEvaluation,
  EndpointRequestWithProject,
} from "../request.interface"

@Injectable()
export class EvaluationContextResolver implements ContextResolver {
  readonly resource = "evaluation" as const

  constructor(
    @InjectRepository(Evaluation)
    private readonly evaluationRepository: Repository<Evaluation>,
  ) {}

  async resolve(request: ResolvableRequest): Promise<void> {
    const requestWithParams = request as ResolvableRequest & {
      params: { evaluationId?: string }
    }
    const evaluationId = requestWithParams.params?.evaluationId

    if (!evaluationId || evaluationId === ":evaluationId") throw new NotFoundException()

    const requestWithProject = request as EndpointRequestWithProject
    const evaluation =
      (await this.evaluationRepository.findOne({
        where: {
          id: evaluationId,
          organizationId: requestWithProject.organizationId,
          projectId: requestWithProject.project.id,
        },
      })) ?? undefined
    if (!evaluation) throw new NotFoundException()

    const requestWithEvaluation = request as EndpointRequestWithEvaluation
    requestWithEvaluation.evaluation = evaluation
  }
}
