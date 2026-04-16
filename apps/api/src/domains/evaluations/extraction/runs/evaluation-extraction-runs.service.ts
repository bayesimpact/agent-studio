import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { v4 } from "uuid"
import { ConnectRepository } from "@/common/entities/connect-repository"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import type {
  LLMChatMessage,
  LLMMetadata,
  LLMProvider,
} from "@/common/interfaces/llm-provider.interface"
import { Agent } from "@/domains/agents/agent.entity"
import { ServiceWithLLM } from "@/external/llm"
import {
  type DatasetSchemaColumn,
  EvaluationExtractionDataset,
} from "../datasets/evaluation-extraction-dataset.entity"
import { EvaluationExtractionDatasetRecord } from "../datasets/records/evaluation-extraction-dataset-record.entity"
import {
  EvaluationExtractionRun,
  type EvaluationExtractionRunKeyMapping,
  type EvaluationExtractionRunSummary,
} from "./evaluation-extraction-run.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { EvaluationExtractionRunGraderService } from "./evaluation-extraction-run-grader.service"
import { EvaluationExtractionRunRecord } from "./records/evaluation-extraction-run-record.entity"

@Injectable()
export class EvaluationExtractionRunsService extends ServiceWithLLM {
  private readonly runConnectRepository: ConnectRepository<EvaluationExtractionRun>
  private readonly runRecordConnectRepository: ConnectRepository<EvaluationExtractionRunRecord>
  private readonly datasetConnectRepository: ConnectRepository<EvaluationExtractionDataset>
  private readonly datasetRecordConnectRepository: ConnectRepository<EvaluationExtractionDatasetRecord>
  private readonly agentConnectRepository: ConnectRepository<Agent>

  constructor(
    @InjectRepository(EvaluationExtractionRun)
    evaluationExtractionRunRepository: Repository<EvaluationExtractionRun>,
    @InjectRepository(EvaluationExtractionRunRecord)
    evaluationExtractionRunRecordRepository: Repository<EvaluationExtractionRunRecord>,
    @InjectRepository(EvaluationExtractionDataset)
    evaluationExtractionDatasetRepository: Repository<EvaluationExtractionDataset>,
    @InjectRepository(EvaluationExtractionDatasetRecord)
    evaluationExtractionDatasetRecordRepository: Repository<EvaluationExtractionDatasetRecord>,
    @InjectRepository(Agent)
    agentRepository: Repository<Agent>,
    private readonly graderService: EvaluationExtractionRunGraderService,
    @Inject("_MockLLMProvider")
    mockLlmProvider: LLMProvider,
    @Inject("VertexLLMProvider")
    vertexLlmProvider: LLMProvider,
    @Inject("MedGemmaLLMProvider")
    medGemmaLlmProvider: LLMProvider,
  ) {
    super({ mockLlmProvider, vertexLlmProvider, medGemmaLlmProvider })
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
    this.datasetRecordConnectRepository = new ConnectRepository(
      evaluationExtractionDatasetRecordRepository,
      "evaluationExtractionDatasetRecord",
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

  async executeRun({
    connectScope,
    runId,
  }: {
    connectScope: RequiredConnectScope
    runId: string
  }): Promise<EvaluationExtractionRun> {
    const run = await this.runConnectRepository.getOneById(connectScope, runId)
    if (!run) {
      throw new NotFoundException(`Evaluation run with id ${runId} not found`)
    }

    if (run.status !== "pending") {
      throw new UnprocessableEntityException(
        `Evaluation run must be in "pending" status to execute. Current status: "${run.status}"`,
      )
    }

    run.status = "running"
    await this.runConnectRepository.saveOne(run)

    const dataset = await this.datasetConnectRepository.getOneById(
      connectScope,
      run.evaluationExtractionDatasetId,
    )
    if (!dataset) {
      throw new NotFoundException(
        `Evaluation dataset with id ${run.evaluationExtractionDatasetId} not found`,
      )
    }

    const datasetRecords = await this.datasetRecordConnectRepository.find(connectScope, {
      where: { evaluationExtractionDatasetId: dataset.id },
    })

    const agent = await this.agentConnectRepository.getOneById(connectScope, run.agentId)
    if (!agent) {
      throw new NotFoundException(`Agent with id ${run.agentId} not found`)
    }

    const summary: EvaluationExtractionRunSummary = {
      total: datasetRecords.length,
      perfectMatches: 0,
      mismatches: 0,
      errors: 0,
    }

    for (const datasetRecord of datasetRecords) {
      try {
        const inputText = this.buildInputText({
          datasetRecord,
          schemaMapping: dataset.schemaMapping,
        })

        const agentOutput = await this.invokeAgent({
          agent,
          inputText,
          connectScope,
        })

        const gradeResult = this.graderService.gradeRecord({
          agentOutput,
          datasetRecordData: datasetRecord.data,
          keyMapping: run.keyMapping,
          schemaMapping: dataset.schemaMapping,
        })

        await this.runRecordConnectRepository.createAndSave(connectScope, {
          evaluationExtractionRunId: run.id,
          evaluationExtractionDatasetRecordId: datasetRecord.id,
          status: gradeResult.status,
          comparison: gradeResult.comparison,
          agentRawOutput: agentOutput,
          errorDetails: null,
        })

        if (gradeResult.status === "match") {
          summary.perfectMatches++
        } else {
          summary.mismatches++
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error during agent invocation"

        await this.runRecordConnectRepository.createAndSave(connectScope, {
          evaluationExtractionRunId: run.id,
          evaluationExtractionDatasetRecordId: datasetRecord.id,
          status: "error",
          comparison: null,
          agentRawOutput: null,
          errorDetails: errorMessage,
        })

        summary.errors++
      }
    }

    run.status = "completed"
    run.summary = summary
    return this.runConnectRepository.saveOne(run)
  }

  private buildInputText({
    datasetRecord,
    schemaMapping,
  }: {
    datasetRecord: EvaluationExtractionDatasetRecord
    schemaMapping: EvaluationExtractionDataset["schemaMapping"]
  }): string {
    const inputColumns: DatasetSchemaColumn[] = Object.values(schemaMapping).filter(
      (column) => column.role === "input",
    )

    const lines: string[] = []
    for (const column of inputColumns) {
      const value = datasetRecord.data[column.id]
      lines.push(`${column.finalName}: ${value ?? ""}`)
    }

    return lines.join("\n")
  }

  private async invokeAgent({
    agent,
    inputText,
    connectScope,
  }: {
    agent: Agent
    inputText: string
    connectScope: RequiredConnectScope
  }): Promise<Record<string, unknown>> {
    if (!agent.outputJsonSchema) {
      throw new UnprocessableEntityException(
        "Agent must have an outputJsonSchema for evaluation runs",
      )
    }

    const traceId = v4()
    const llmMessage: LLMChatMessage = {
      role: "user",
      content: [{ type: "text", text: inputText }],
    }

    const systemPrompt = `Today's date: ${new Date().toLocaleDateString()}\n\n${agent.defaultPrompt}`

    const llmConfig = this.buildLLMConfig({
      systemPrompt,
      model: agent.model,
      temperature: agent.temperature,
    })

    const llmMetadata: LLMMetadata = {
      traceId,
      agentSessionId: traceId,
      currentTurn: 1,
      organizationId: connectScope.organizationId,
      agentId: agent.id,
      projectId: connectScope.projectId,
      tags: [agent.name, "evaluation-extraction-run"],
    }

    return this.getProviderForModel(agent.model).generateStructuredOutput({
      message: llmMessage,
      schema: agent.outputJsonSchema,
      config: llmConfig,
      metadata: llmMetadata,
    })
  }
}
