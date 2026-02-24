import { Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ConnectRepository } from "@/common/entities/connect-repository"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import { EvaluationReport } from "./evaluation-report.entity"

@Injectable()
export class EvaluationReportsService {
  constructor(
    @InjectRepository(EvaluationReport)
    reportRepository: Repository<EvaluationReport>,
  ) {
    this.reportConnectRepository = new ConnectRepository(reportRepository, "evaluation_reports")
  }

  private readonly reportConnectRepository: ConnectRepository<EvaluationReport>

  async createReport({
    connectScope,
    evaluationId,
    fields,
  }: {
    connectScope: RequiredConnectScope
    evaluationId: string
    fields: Pick<EvaluationReport, "agentId" | "traceId" | "output" | "score">
  }): Promise<EvaluationReport> {
    return await this.reportConnectRepository.createAndSave(connectScope, {
      ...fields,
      evaluationId,
    })
  }

  async listReports({
    connectScope,
    evaluationId,
  }: {
    connectScope: RequiredConnectScope
    evaluationId: string
  }): Promise<EvaluationReport[]> {
    const reports = await this.reportConnectRepository.find(connectScope, {
      where: { evaluationId },
    })
    return reports
  }

  async findById({
    connectScope,
    reportId,
  }: {
    connectScope: RequiredConnectScope
    reportId: string
  }): Promise<EvaluationReport | null> {
    return this.reportConnectRepository.getOneById(connectScope, reportId)
  }

  async updateReport({
    connectScope,
    required,
    fieldsToUpdate,
  }: {
    connectScope: RequiredConnectScope
    required: { reportId: string }
    fieldsToUpdate: Partial<Pick<EvaluationReport, "agentId" | "traceId" | "output" | "score">>
  }): Promise<EvaluationReport> {
    const { reportId } = required
    const { agentId, traceId, output, score } = fieldsToUpdate

    if (agentId !== undefined && !agentId.trim()) {
      throw new UnprocessableEntityException("Agent ID is required")
    }

    if (traceId !== undefined && !traceId.trim()) {
      throw new UnprocessableEntityException("Trace ID is required")
    }

    if (output !== undefined && !output.trim()) {
      throw new UnprocessableEntityException("Output is required")
    }

    if (score !== undefined && !score.trim()) {
      throw new UnprocessableEntityException("Score is required")
    }

    const report = await this.reportConnectRepository.getOneById(connectScope, reportId)

    if (!report) {
      throw new NotFoundException(`Report with id ${reportId} not found`)
    }

    Object.assign(report, {
      ...(agentId !== undefined && { agentId }),
      ...(traceId !== undefined && { traceId }),
      ...(output !== undefined && { output }),
      ...(score !== undefined && { score }),
    })

    return await this.reportConnectRepository.saveOne(report)
  }

  async deleteReport({
    connectScope,
    reportId,
  }: {
    connectScope: RequiredConnectScope
    reportId: string
  }): Promise<void> {
    const isDeleted = await this.reportConnectRepository.deleteOneById({
      connectScope,
      id: reportId,
    })

    if (!isDeleted) {
      throw new NotFoundException(`Report with id ${reportId} not found`)
    }
  }
}
