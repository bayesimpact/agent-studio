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

  async markRunCancelled({
    run,
  }: {
    run: EvaluationExtractionRun
  }): Promise<EvaluationExtractionRun> {
    if (run.status === "completed" || run.status === "failed" || run.status === "cancelled") {
      throw new UnprocessableEntityException(
        `Evaluation run is in status "${run.status}" and cannot be cancelled`,
      )
    }

    run.status = "cancelled"
    return this.runConnectRepository.saveOne(run)
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

  async getRunRecordsPaginated({
    connectScope,
    runId,
    page,
    limit,
    columnFilters,
    sortBy,
    sortOrder,
  }: {
    connectScope: RequiredConnectScope
    runId: string
    page: number
    limit: number
    columnFilters?: Record<string, string>
    sortBy?: string
    sortOrder?: "asc" | "desc"
  }): Promise<{ records: EvaluationExtractionRunRecord[]; total: number }> {
    const alias = "evaluationExtractionRunRecord"
    const datasetRecordAlias = "datasetRecord"

    const query = this.runRecordConnectRepository
      .newQueryBuilderWithConnectScope(connectScope)
      .leftJoinAndSelect(`${alias}.evaluationExtractionDatasetRecord`, datasetRecordAlias)
      .andWhere(`${alias}.evaluation_extraction_run_id = :runId`, { runId })

    const safeKeyPattern = /^[a-zA-Z0-9_-]+$/

    if (columnFilters) {
      for (const [columnId, filterValue] of Object.entries(columnFilters)) {
        if (!filterValue) continue
        const paramName = `filter_${columnId.replace(/[^a-zA-Z0-9_]/g, "_")}`

        if (columnId === "status") {
          query.andWhere(`${alias}.status ILIKE :${paramName}`, {
            [paramName]: `%${filterValue}%`,
          })
        } else if (columnId === "errorDetails") {
          query.andWhere(`${alias}.error_details ILIKE :${paramName}`, {
            [paramName]: `%${filterValue}%`,
          })
        } else if (columnId.startsWith("input_") && safeKeyPattern.test(columnId.slice(6))) {
          const dataKey = columnId.slice(6)
          query.andWhere(`${datasetRecordAlias}.data ->> '${dataKey}' ILIKE :${paramName}`, {
            [paramName]: `%${filterValue}%`,
          })
        } else if (columnId.startsWith("target_") && safeKeyPattern.test(columnId.slice(7))) {
          const comparisonKey = columnId.slice(7)
          query.andWhere(
            `${alias}.comparison -> '${comparisonKey}' ->> 'groundTruth' ILIKE :${paramName}`,
            { [paramName]: `%${filterValue}%` },
          )
        } else if (columnId.startsWith("agent_") && safeKeyPattern.test(columnId.slice(6))) {
          const comparisonKey = columnId.slice(6)
          query.andWhere(
            `${alias}.comparison -> '${comparisonKey}' ->> 'agentValue' ILIKE :${paramName}`,
            { [paramName]: `%${filterValue}%` },
          )
        }
      }
    }

    // TypeORM's getManyAndCount with joins resolves orderBy expressions via
    // findColumnWithPropertyPath, which expects entity property names (createdAt),
    // not database column names (created_at). For JSON/JSONB path expressions that
    // can't map to a property, use addSelect with an alias so TypeORM resolves
    // the orderBy via the select alias instead.
    const sortAlias = "__sort_val"
    if (sortBy) {
      const direction = sortOrder === "asc" ? "ASC" : "DESC"
      if (sortBy === "status") {
        query.orderBy(`${alias}.status`, direction)
      } else if (sortBy === "errorDetails") {
        query.orderBy(`${alias}.errorDetails`, direction)
      } else if (sortBy.startsWith("input_") && safeKeyPattern.test(sortBy.slice(6))) {
        const dataKey = sortBy.slice(6)
        query.addSelect(`${datasetRecordAlias}.data ->> '${dataKey}'`, sortAlias)
        query.orderBy(sortAlias, direction)
      } else if (sortBy.startsWith("target_") && safeKeyPattern.test(sortBy.slice(7))) {
        const comparisonKey = sortBy.slice(7)
        query.addSelect(`${alias}.comparison -> '${comparisonKey}' ->> 'groundTruth'`, sortAlias)
        query.orderBy(sortAlias, direction)
      } else if (sortBy.startsWith("agent_") && safeKeyPattern.test(sortBy.slice(6))) {
        const comparisonKey = sortBy.slice(6)
        query.addSelect(`${alias}.comparison -> '${comparisonKey}' ->> 'agentValue'`, sortAlias)
        query.orderBy(sortAlias, direction)
      } else {
        query.orderBy(`${alias}.createdAt`, "ASC")
      }
    } else {
      query.orderBy(`${alias}.createdAt`, "ASC")
    }

    query.skip(page * limit).take(limit)

    const [records, total] = await query.getManyAndCount()

    return { records, total }
  }
}
