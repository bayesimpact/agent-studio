import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { EvaluationReport } from "@/domains/evaluations/reports/evaluation-report.entity"
import type { ContextResolver, ResolvableRequest } from "../context-resolver.interface"
import type { EndpointRequestWithEvaluation } from "../request.interface"

@Injectable()
export class EvaluationReportContextResolver implements ContextResolver {
  readonly resource = "evaluationReport" as const

  constructor(
    @InjectRepository(EvaluationReport)
    private readonly reportRepository: Repository<EvaluationReport>,
  ) {}

  async resolve(request: ResolvableRequest): Promise<void> {
    const requestWithParams = request as ResolvableRequest & {
      params: { evaluationReportId?: string; evaluationId?: string }
    }
    const evaluationReportId = requestWithParams.params?.evaluationReportId
    const evaluationId = requestWithParams.params?.evaluationId

    if (!evaluationReportId || evaluationReportId === ":evaluationReportId")
      throw new NotFoundException()
    if (!evaluationId || evaluationId === ":evaluationId") throw new NotFoundException()

    const requestWithEvaluation = request as EndpointRequestWithEvaluation
    const report =
      (await this.reportRepository.findOne({
        where: {
          id: evaluationReportId,
          evaluationId,
          organizationId: requestWithEvaluation.organizationId,
        },
      })) ?? undefined
    if (!report) throw new NotFoundException()

    ;(
      request as EndpointRequestWithEvaluation & { evaluationReport: EvaluationReport }
    ).evaluationReport = report
  }
}
