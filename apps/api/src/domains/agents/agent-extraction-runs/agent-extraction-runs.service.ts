import { URL } from "node:url"
import type { AgentExtractionRunType } from "@caseai-connect/api-contracts"
import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { FilePart, ImagePart } from "ai"
import { JSONParseError, TypeValidationError } from "ai"
import type { Repository } from "typeorm"
import { v4 } from "uuid"
import { ConnectRepository } from "@/common/entities/connect-repository"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import type {
  LLMChatMessage,
  LLMConfig,
  LLMMetadata,
  LLMProvider,
} from "@/common/interfaces/llm-provider.interface"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DocumentsService } from "@/domains/documents/documents.service"
import {
  FILE_STORAGE_SERVICE,
  type IFileStorage,
} from "@/domains/documents/storage/file-storage.interface"
import type { Agent } from "../agent.entity"
import { AgentExtractionRun } from "./agent-extraction-run.entity"

@Injectable()
export class AgentExtractionRunsService {
  constructor(
    @InjectRepository(AgentExtractionRun)
    runRepository: Repository<AgentExtractionRun>,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorage,
    private readonly documentsService: DocumentsService,
    @Inject("LLMProvider")
    private readonly llmProvider: LLMProvider,
  ) {
    this.runConnectRepository = new ConnectRepository(runRepository, "agentExtractionRun")
  }

  private readonly runConnectRepository: ConnectRepository<AgentExtractionRun>

  async executeExtraction({
    connectScope,
    agent,
    userId,
    documentId,
    promptOverride,
    type,
  }: {
    connectScope: RequiredConnectScope
    agent: Agent
    userId: string
    documentId: string
    promptOverride?: string
    type: AgentExtractionRunType
  }): Promise<AgentExtractionRun> {
    if (agent.type !== "extraction") {
      throw new UnprocessableEntityException("Only extraction agents can run extraction")
    }

    if (!agent.outputJsonSchema || !agent.defaultPrompt) {
      throw new UnprocessableEntityException(
        "Extraction agent configuration is invalid: missing outputJsonSchema or defaultPrompt",
      )
    }

    const effectivePrompt = promptOverride ?? agent.defaultPrompt
    const document = await this.documentsService.findById({ connectScope, documentId })

    if (!document) {
      throw new NotFoundException(`Document with id ${documentId} not found`)
    }

    const run = await this.runConnectRepository.createAndSave(connectScope, {
      agentId: agent.id,
      userId,
      documentId,
      status: "failed",
      type,
      result: null,
      errorCode: null,
      errorDetails: null,
      effectivePrompt,
      schemaSnapshot: agent.outputJsonSchema,
      traceId: v4(),
    })

    try {
      const llmMessage = await this.buildLLMMessage({
        connectScope,
        documentId,
        prompt: effectivePrompt,
      })

      const result = await this.llmProvider.generateStructuredOutput({
        message: llmMessage,
        schema: agent.outputJsonSchema,
        config: this.buildLLMConfig(agent),
        metadata: this.buildLLMMetadata({ agent, run, connectScope }),
      })

      run.status = "success"
      run.result = result
      run.errorCode = null
      run.errorDetails = null
      return await this.runConnectRepository.saveOne(run)
    } catch (error) {
      run.status = "failed"
      run.result = null

      const isSchemaValidationError =
        TypeValidationError.isInstance(error) ||
        JSONParseError.isInstance(error) ||
        (error instanceof Error &&
          (error.name === "TypeValidationError" || error.name === "JSONParseError"))

      if (isSchemaValidationError) {
        run.errorCode = "SCHEMA_VALIDATION_FAILED"
        run.errorDetails = { message: error.message }
        await this.runConnectRepository.saveOne(run)
        throw new UnprocessableEntityException("Model output does not match outputJsonSchema")
      }

      run.errorCode = "EXTRACTION_PROVIDER_ERROR"
      run.errorDetails = {
        message: error instanceof Error ? error.message : "Unknown extraction provider error",
      }
      await this.runConnectRepository.saveOne(run)
      throw error
    }
  }

  async listRuns({
    connectScope,
    agentId,
    type,
  }: {
    connectScope: RequiredConnectScope
    agentId: string
    type: AgentExtractionRunType
  }): Promise<AgentExtractionRun[]> {
    return this.runConnectRepository.find(connectScope, {
      where: { agentId, type },
      order: { createdAt: "DESC" },
    })
  }

  async findRunById({
    connectScope,
    runId,
    agentId,
    type,
  }: {
    connectScope: RequiredConnectScope
    runId: string
    agentId: string
    type: AgentExtractionRunType
  }): Promise<AgentExtractionRun | null> {
    const run = await this.runConnectRepository.getOneById(connectScope, runId)

    if (!run || run.agentId !== agentId || run.type !== type) {
      return null
    }

    return run
  }

  private async buildLLMMessage({
    connectScope,
    documentId,
    prompt,
  }: {
    connectScope: RequiredConnectScope
    documentId: string
    prompt: string
  }): Promise<LLMChatMessage> {
    const document = await this.documentsService.findById({ connectScope, documentId })
    if (!document) {
      throw new Error(`Document with ID ${documentId} not found`)
    }

    const url = await this.fileStorageService.getTemporaryUrl(document.storageRelativePath)
    const llmMessage: LLMChatMessage = {
      role: "user",
      content: [{ type: "text", text: prompt }],
    }

    switch (document.mimeType) {
      case "application/pdf": {
        const content = llmMessage.content as Array<FilePart>
        content.push({
          type: "file",
          mediaType: "application/pdf",
          data: new URL(url),
          filename: document.fileName,
        })
        break
      }
      case "image/png":
      case "image/jpeg":
      case "image/jpg": {
        const content = llmMessage.content as Array<ImagePart>
        content.push({
          type: "image",
          image: new URL(url),
        })
        break
      }
      default:
        throw new UnprocessableEntityException(`Unsupported document type: ${document.mimeType}`)
    }

    return llmMessage
  }

  private buildLLMConfig(agent: Agent): LLMConfig {
    const temperature =
      typeof agent.temperature === "string"
        ? parseFloat(agent.temperature)
        : Number(agent.temperature)

    if (Number.isNaN(temperature) || temperature < 0 || temperature > 2) {
      throw new Error(
        `Invalid temperature value: ${agent.temperature}. Temperature must be a number between 0 and 2.`,
      )
    }

    return {
      model: agent.model,
      temperature,
      systemPrompt: `Today's date: ${new Date().toLocaleDateString()}`,
    }
  }

  private buildLLMMetadata({
    agent,
    run,
    connectScope,
  }: {
    agent: Agent
    run: AgentExtractionRun
    connectScope: RequiredConnectScope
  }): LLMMetadata {
    return {
      traceId: run.traceId,
      organizationId: connectScope.organizationId,
      agentSessionId: run.id,
      agentId: agent.id,
      projectId: connectScope.projectId,
      currentTurn: 1,
      tags: [agent.name, "extraction"],
    }
  }
}
