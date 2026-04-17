import { Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ConnectRepository } from "@/common/entities/connect-repository"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import { Agent } from "@/domains/agents/agent.entity"
import { EvaluationExtractionDataset } from "../datasets/evaluation-extraction-dataset.entity"
import {
  EvaluationExtractionRun,
  type EvaluationExtractionRunKeyMapping,
} from "./evaluation-extraction-run.entity"
import { EvaluationExtractionRunRecord } from "./records/evaluation-extraction-run-record.entity"

@Injectable()
export class EvaluationExtractionRunsService {
  private readonly runConnectRepository: ConnectRepository<EvaluationExtractionRun>
  private readonly runRecordConnectRepository: ConnectRepository<EvaluationExtractionRunRecord>
  private readonly datasetConnectRepository: ConnectRepository<EvaluationExtractionDataset>
  private readonly agentConnectRepository: ConnectRepository<Agent>

  constructor(
    @InjectRepository(EvaluationExtractionRun)
    evaluationExtractionRunRepository: Repository<EvaluationExtractionRun>,
    @InjectRepository(EvaluationExtractionRunRecord)
    evaluationExtractionRunRecordRepository: Repository<EvaluationExtractionRunRecord>,
    @InjectRepository(EvaluationExtractionDataset)
    evaluationExtractionDatasetRepository: Repository<EvaluationExtractionDataset>,
    @InjectRepository(Agent)
    agentRepository: Repository<Agent>,
  ) {
    this.runConnectRepository = new ConnectRepository(
      evaluationExtractionRunRepository,
      "evaluationExtractionRun",
    )
    this.runRecordConnectRepository = new ConnectRepository(
      evaluationExtractionRunRecordRepository,
      "evaluationExtractionRunRecord",
    )
    this.datasetConnectRepository = new ConnectRepository(
      evaluationExtractionDatasetRepository,
      "evaluationExtractionDataset",
    )
    this.agentConnectRepository = new ConnectRepository(agentRepository, "agent")
  }

  async createRun({
    connectScope,
    fields,
  }: {
    connectScope: RequiredConnectScope
    fields: {
      evaluationExtractionDatasetId: string
      agentId: string
      keyMapping: EvaluationExtractionRunKeyMapping
    }
  }): Promise<EvaluationExtractionRun> {
    const dataset = await this.datasetConnectRepository.getOneById(
      connectScope,
      fields.evaluationExtractionDatasetId,
    )
    if (!dataset) {
      throw new NotFoundException(
        `Evaluation dataset with id ${fields.evaluationExtractionDatasetId} not found`,
      )
    }

    const agent = await this.agentConnectRepository.getOneById(connectScope, fields.agentId)
    if (!agent) {
      throw new NotFoundException(`Agent with id ${fields.agentId} not found`)
    }

    if (agent.type !== "extraction") {
      throw new UnprocessableEntityException(
        "Only extraction agents can be used for evaluation runs",
      )
    }

    return this.runConnectRepository.createAndSave(connectScope, {
      evaluationExtractionDatasetId: fields.evaluationExtractionDatasetId,
      agentId: fields.agentId,
      keyMapping: fields.keyMapping,
      status: "pending",
      summary: null,
    })
  }

  async getRun({
    connectScope,
    runId,
  }: {
    connectScope: RequiredConnectScope
    runId: string
  }): Promise<EvaluationExtractionRun | null> {
    return this.runConnectRepository.getOneById(connectScope, runId)
  }

  async listRuns({
    connectScope,
  }: {
    connectScope: RequiredConnectScope
  }): Promise<EvaluationExtractionRun[]> {
    const runs = await this.runConnectRepository.find(connectScope, {
      order: { createdAt: "DESC" },
    })
    return runs
  }

  async getRunRecords({
    connectScope,
    runId,
  }: {
    connectScope: RequiredConnectScope
    runId: string
  }): Promise<EvaluationExtractionRunRecord[]> {
    return this.runRecordConnectRepository.find(connectScope, {
      where: { evaluationExtractionRunId: runId },
      order: { createdAt: "ASC" },
    })
  }
}
