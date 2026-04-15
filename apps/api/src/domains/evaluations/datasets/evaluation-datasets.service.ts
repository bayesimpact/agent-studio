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
import { EvaluationDatasetDocument } from "./evaluation-dataset-document.entity"
import {
  EvaluationDatasetRecord,
  type EvaluationDatasetRecordData,
} from "./records/evaluation-dataset-record.entity"

export type DatasetFileColumn = {
  id: string
  name: string
  values: unknown[]
}

@Injectable()
export class EvaluationDatasetsService {
  private readonly datasetConnectRepository: ConnectRepository<EvaluationDataset>
  private readonly recordConnectRepository: ConnectRepository<EvaluationDatasetRecord>
  private readonly evaluationDatasetDocumentRepository: Repository<EvaluationDatasetDocument>

  constructor(
    @InjectRepository(EvaluationDatasetDocument)
    evaluationDatasetDocumentRepository: Repository<EvaluationDatasetDocument>,
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
    this.evaluationDatasetDocumentRepository = evaluationDatasetDocumentRepository
  }

  async listFiles({ connectScope }: { connectScope: RequiredConnectScope }): Promise<Document[]> {
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

  private sortNewestFirst = (a: EvaluationDataset, b: EvaluationDataset) =>
    b.updatedAt.getTime() - a.updatedAt.getTime()

  async listDatasets({
    connectScope,
  }: {
    connectScope: RequiredConnectScope
  }): Promise<EvaluationDataset[]> {
    const datasets = await this.datasetConnectRepository.find(connectScope, {
      relations: ["evaluationDatasetDocuments", "evaluationDatasetDocuments.document"],
    })
    return datasets.sort(this.sortNewestFirst)
  }

  async listDatasetRecords({
    connectScope,
    datasetId,
  }: {
    connectScope: RequiredConnectScope
    datasetId: string
  }): Promise<EvaluationDatasetRecord[]> {
    return this.recordConnectRepository.find(connectScope, {
      where: { evaluationDatasetId: datasetId },
    })
  }

  async createDataset({
    connectScope,
    name,
  }: {
    connectScope: RequiredConnectScope
    name: string
  }): Promise<EvaluationDataset> {
    if (!name.trim()) {
      throw new UnprocessableEntityException("Dataset name is required")
    }

    const dataset = await this.datasetConnectRepository.createAndSave(connectScope, {
      name,
      schemaMapping: {}, // empty schema mapping by default, user can update the columns later
    })

    return dataset
  }

  async updateDataset({
    connectScope,
    datasetId,
    fields: { name, documentId, columns },
  }: {
    connectScope: RequiredConnectScope
    datasetId: string
    fields: { name: string; documentId: string; columns: EvaluationDatasetSchemaColumnDto[] }
  }): Promise<EvaluationDataset> {
    if (!name.trim()) {
      throw new UnprocessableEntityException("Dataset name is required")
    }

    const dataset = await this.datasetConnectRepository.getOneById(connectScope, datasetId)
    if (!dataset) {
      throw new NotFoundException(`Evaluation dataset with id ${datasetId} not found`)
    }

    const document = await this.documentsService.findById({ connectScope, documentId })
    if (!document) {
      throw new NotFoundException(`Document with id ${documentId} not found`)
    }

    const newValues = {
      name,
      schemaMapping: this.buildSchemaMapping(columns),
    }
    Object.assign(dataset, newValues)
    await this.datasetConnectRepository.saveOne(dataset)

    // Link dataset to document
    await this.evaluationDatasetDocumentRepository.save({
      evaluationDatasetId: dataset.id,
      documentId,
      organizationId: connectScope.organizationId,
      projectId: connectScope.projectId,
    })

    return dataset
  }

  async createDatasetRecords({
    connectScope,
    documentId,
    datasetId,
  }: {
    connectScope: RequiredConnectScope
    documentId: string
    datasetId: string
  }): Promise<EvaluationDatasetRecord[]> {
    // TODO: transaction
    const dataset = await this.datasetConnectRepository.getOneById(connectScope, datasetId)
    if (!dataset) {
      throw new NotFoundException(`Evaluation dataset with id ${datasetId} not found`)
    }

    const document = await this.documentsService.findById({
      connectScope,
      documentId,
    })
    if (!document) {
      throw new NotFoundException(`Document with id ${documentId} not found`)
    }

    const rows = await this.parseCsvRows({ schemaMapping: dataset.schemaMapping, document })

    const records: EvaluationDatasetRecord[] = []
    for (const row of rows) {
      const record = await this.recordConnectRepository.createAndSave(connectScope, {
        evaluationDatasetId: datasetId,
        data: row,
      })
      records.push(record)
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
      values: (parsed.data as Record<string, unknown>[]).map((row) =>
        this.standardizedNulls(row[fieldName]),
      ),
    }))
  }

  private standardizedNulls(value: unknown): unknown {
    if (
      value === "N/A" ||
      value === "NaN" ||
      value === "" ||
      value === "null" ||
      value === "NULL" ||
      value === "NA"
    ) {
      return null
    }
    return value
  }

  private async parseCsvRows({
    schemaMapping,
    document,
  }: {
    schemaMapping: EvaluationDatasetSchemaMapping
    document: Document
  }): Promise<EvaluationDatasetRecordData[]> {
    const buffer = await this.fileStorageService.readFile(document.storageRelativePath)
    const csvContent = buffer.toString("utf-8")

    const parsed = Papa.parse(csvContent, {
      skipEmptyLines: true,
      header: true,
    })

    if (!parsed.meta.fields || parsed.meta.fields.length === 0) {
      throw new UnprocessableEntityException("CSV file has no columns")
    }

    const columns = Object.values(schemaMapping)

    return (parsed.data as Record<string, unknown>[]).map((csvRow) => {
      const row: EvaluationDatasetRecordData = {}
      for (const column of columns) {
        row[column.id] = this.standardizedNulls(csvRow[column.originalName])
      }
      return row
    })
  }
}
