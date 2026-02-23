import { Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ConnectRepository } from "@/common/entities/connect-repository"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import { Evaluation } from "./evaluation.entity"

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectRepository(Evaluation)
    evaluationRepository: Repository<Evaluation>,
  ) {
    this.evaluationConnectRepository = new ConnectRepository(evaluationRepository, "evaluations")
  }

  private readonly evaluationConnectRepository: ConnectRepository<Evaluation>

  async createEvaluation({
    connectScope,
    fields,
  }: {
    connectScope: RequiredConnectScope
    fields: Pick<Evaluation, "input" | "expectedOutput">
  }): Promise<Evaluation> {
    const { input, expectedOutput } = fields

    if (!input.trim()) {
      throw new UnprocessableEntityException("Evaluation input is required")
    }

    if (!expectedOutput.trim()) {
      throw new UnprocessableEntityException("Evaluation expected output is required")
    }

    return await this.evaluationConnectRepository.createAndSave(connectScope, fields)
  }

  async listEvaluations(connectScope: RequiredConnectScope): Promise<Evaluation[]> {
    return (await this.evaluationConnectRepository.getMany(connectScope))?.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )
  }

  async findById({
    connectScope,
    evaluationId,
  }: {
    connectScope: RequiredConnectScope
    evaluationId: string
  }): Promise<Evaluation | null> {
    return this.evaluationConnectRepository.getOneById(connectScope, evaluationId)
  }

  async updateEvaluation({
    connectScope,
    required,
    fieldsToUpdate,
  }: {
    connectScope: RequiredConnectScope
    required: { evaluationId: string }
    fieldsToUpdate: Partial<Pick<Evaluation, "input" | "expectedOutput">>
  }): Promise<Evaluation> {
    const { evaluationId } = required
    const { input, expectedOutput } = fieldsToUpdate

    if (input !== undefined && !input.trim()) {
      throw new UnprocessableEntityException("Evaluation input is required")
    }

    if (expectedOutput !== undefined && !expectedOutput.trim()) {
      throw new UnprocessableEntityException("Evaluation expected output is required")
    }

    const evaluation = await this.evaluationConnectRepository.getOneById(connectScope, evaluationId)

    if (!evaluation) {
      throw new NotFoundException(`Evaluation with id ${evaluationId} not found`)
    }

    Object.assign(evaluation, {
      ...(input !== undefined && { input }),
      ...(expectedOutput !== undefined && { expectedOutput }),
    })

    return await this.evaluationConnectRepository.saveOne(evaluation)
  }

  async deleteEvaluation({
    connectScope,
    evaluationId,
  }: {
    connectScope: RequiredConnectScope
    evaluationId: string
  }): Promise<void> {
    const isDeleted = await this.evaluationConnectRepository.deleteOneById({
      connectScope,
      id: evaluationId,
    })

    if (!isDeleted) {
      throw new NotFoundException(`Evaluation with id ${evaluationId} not found`)
    }
  }
}
