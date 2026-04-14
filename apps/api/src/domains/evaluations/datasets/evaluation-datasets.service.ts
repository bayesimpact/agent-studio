import type { EvaluationDatasetSchemaColumnDto } from "@caseai-connect/api-contracts"
import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import * as Papa from "papaparse"
import type { Repository } from "typeorm"
import { v4 } from "uuid"
import { ConnectRepository } from "@/common/entities/connect-repository"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import type { Document } from "@/domains/documents/document.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DocumentsService } from "@/domains/documents/documents.service"
import {
  FILE_STORAGE_SERVICE,
  type IFileStorage,
} from "@/domains/documents/storage/file-storage.interface"
import {
  type DatasetSchemaColumn,
  EvaluationDataset,
  type EvaluationDatasetSchemaMapping,
} from "./evaluation-dataset.entity"
import { EvaluationDatasetRecord } from "./records/evaluation-dataset-record.entity"

export type DatasetFileColumn = {
  id: string
  name: string
  values: unknown[]
}

@Injectable()
export class EvaluationDatasetsService {
  constructor(
    @InjectRepository(EvaluationDataset)
    evaluationDatasetRepository: Repository<EvaluationDataset>,
    @InjectRepository(EvaluationDatasetRecord)
    evaluationDatasetRecordRepository: Repository<EvaluationDatasetRecord>,
    private readonly documentsService: DocumentsService,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorage,
  ) {
    this.datasetConnectRepository = new ConnectRepository(
      evaluationDatasetRepository,
      "evaluationDatasets",
    )
    this.recordConnectRepository = new ConnectRepository(
      evaluationDatasetRecordRepository,
      "evaluationDatasetRecords",
    )
  }

  private readonly datasetConnectRepository: ConnectRepository<EvaluationDataset>
  private readonly recordConnectRepository: ConnectRepository<EvaluationDatasetRecord>

  async listDatasetFiles({
    connectScope,
  }: {
    connectScope: RequiredConnectScope
  }): Promise<Document[]> {
    return this.documentsService.listBySourceType({
      connectScope,
      sourceType: "evaluationDataset",
    })
  }

  async getFileColumns({
    connectScope,
    documentId,
    options = { header: true, preview: 5, skipEmptyLines: true },
  }: {
    connectScope: RequiredConnectScope
    documentId: string
    options?: {
      header: boolean
      preview: number
      skipEmptyLines: boolean
    }
  }): Promise<DatasetFileColumn[]> {
    const document = await this.documentsService.findById({ connectScope, documentId })
    if (!document) {
      throw new NotFoundException(`Document with id ${documentId} not found`)
    }
    const columns = await this.parseCsvColumns({ document, options })
    return columns
  }

  async createDataset({
    connectScope,
    fields: { name, documentId, columns },
  }: {
    connectScope: RequiredConnectScope
    fields: { name: string; documentId: string; columns: EvaluationDatasetSchemaColumnDto[] }
  }): Promise<EvaluationDataset> {
    if (!name.trim()) {
      throw new UnprocessableEntityException("Dataset name is required")
    }

    if (!documentId.trim()) {
      throw new UnprocessableEntityException("Document ID is required")
    }

    const document = await this.documentsService.findById({ connectScope, documentId })
    if (!document) {
      throw new NotFoundException(`Document with id ${documentId} not found`)
    }

    const dataset = await this.datasetConnectRepository.createAndSave(connectScope, {
      name,
      schemaMapping: this.buildSchemaMapping(columns),
      documentId,
    })

    return dataset
  }

  async createDatasetRecords({
    connectScope,
    datasetId,
  }: {
    connectScope: RequiredConnectScope
    datasetId: string
  }): Promise<EvaluationDatasetRecord[]> {
    const dataset = await this.datasetConnectRepository.getOneById(connectScope, datasetId)
    if (!dataset) {
      throw new NotFoundException(`Evaluation dataset with id ${datasetId} not found`)
    }

    const columns = await this.getFileColumns({
      connectScope,
      documentId: dataset.documentId,
      options: { header: true, preview: 10000, skipEmptyLines: true },
    })

    const records: EvaluationDatasetRecord[] = []

    for (const column of columns) {
      for (const value of column.values) {
        const columnId = column.id

        const record = await this.recordConnectRepository.createAndSave(connectScope, {
          evaluationDatasetId: datasetId,
          data: { columnId, value },
        })

        if (!record) {
          throw new UnprocessableEntityException(
            `Failed to create record for column ${column.name} in dataset ${datasetId}`,
          )
        }
        records.push(record)
      }
    }
    return records
  }

  private buildSchemaMapping(
    columns: EvaluationDatasetSchemaColumnDto[],
  ): EvaluationDatasetSchemaMapping {
    const schemaMapping: EvaluationDatasetSchemaMapping = {}
    for (const column of columns) {
      schemaMapping[column.id] = {
        finalName: column.finalName,
        id: column.id,
        index: column.index,
        originalName: column.originalName,
        role: column.role,
      }
    }
    return schemaMapping
  }

  async deleteDataset({
    connectScope,
    datasetId,
  }: {
    connectScope: RequiredConnectScope
    datasetId: string
  }): Promise<void> {
    // Soft-delete all records belonging to this dataset
    const records = await this.recordConnectRepository.find(connectScope, {
      where: { evaluationDatasetId: datasetId },
    })
    for (const record of records) {
      await this.recordConnectRepository.deleteOneById({
        connectScope,
        id: record.id,
      })
    }

    const isDeleted = await this.datasetConnectRepository.deleteOneById({
      connectScope,
      id: datasetId,
    })

    if (!isDeleted) {
      throw new NotFoundException(`Evaluation dataset with id ${datasetId} not found`)
    }
  }

  async updateDatasetColumns({
    connectScope,
    datasetId,
    columns,
  }: {
    connectScope: RequiredConnectScope
    datasetId: string
    columns: EvaluationDatasetSchemaColumnDto[]
  }): Promise<DatasetSchemaColumn[]> {
    const dataset = await this.datasetConnectRepository.getOneById(connectScope, datasetId)

    if (!dataset) {
      throw new NotFoundException(`Evaluation dataset with id ${datasetId} not found`)
    }

    dataset.schemaMapping = this.buildSchemaMapping(columns)
    await this.datasetConnectRepository.saveOne(dataset)

    return columns
  }

  private async parseCsvColumns({
    document,
    options,
  }: {
    document: Document
    options: {
      header: boolean
      preview: number
      skipEmptyLines: boolean
    }
  }): Promise<DatasetFileColumn[]> {
    const buffer = await this.fileStorageService.readFile(document.storageRelativePath)
    const csvContent = buffer.toString("utf-8")

    const parsed = Papa.parse(csvContent, options)

    if (!parsed.meta.fields || parsed.meta.fields.length === 0) {
      throw new UnprocessableEntityException("CSV file has no columns")
    }

    return parsed.meta.fields.map((fieldName) => ({
      id: v4(),
      name: fieldName,
      values: (parsed.data as Record<string, unknown>[]).map((row) => row[fieldName]),
    }))
  }
}
