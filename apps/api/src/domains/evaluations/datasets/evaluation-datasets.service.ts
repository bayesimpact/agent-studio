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
import { EvaluationDataset } from "./evaluation-dataset.entity"
import { EvaluationDatasetRecord } from "./records/evaluation-dataset-record.entity"

export type DatasetFileColumn = {
  id: string
  name: string
  sampleValues: unknown[]
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
  }: {
    connectScope: RequiredConnectScope
    documentId: string
  }): Promise<DatasetFileColumn[]> {
    const document = await this.documentsService.findById({ connectScope, documentId })
    if (!document) {
      throw new NotFoundException(`Document with id ${documentId} not found`)
    }
    const columns = await this.parseCsvColumns(document)
    return columns
  }

  async createDataset({
    connectScope,
    fields,
  }: {
    connectScope: RequiredConnectScope
    fields: { name: string; documentId: string }
  }): Promise<{ dataset: EvaluationDataset; columns: DatasetFileColumn[] }> {
    const { name, documentId } = fields

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

    const columns = await this.parseCsvColumns(document)

    const dataset = await this.datasetConnectRepository.createAndSave(connectScope, {
      name,
      documentId,
    })

    return { dataset, columns }
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

  async setColumnRoles({
    connectScope,
    datasetId,
    columns,
  }: {
    connectScope: RequiredConnectScope
    datasetId: string
    columns: { name: string; role: "input" | "reference" | "target" | "ignore" }[]
  }): Promise<{ name: string; role: "input" | "reference" | "target" | "ignore" }[]> {
    const dataset = await this.datasetConnectRepository.getOneById(connectScope, datasetId)

    if (!dataset) {
      throw new NotFoundException(`Evaluation dataset with id ${datasetId} not found`)
    }

    const schemaMapping: Record<string, string> = {}
    for (const column of columns) {
      schemaMapping[column.name] = column.role
    }

    dataset.schemaMapping = schemaMapping
    await this.datasetConnectRepository.saveOne(dataset)

    return columns
  }

  private async parseCsvColumns(document: Document): Promise<DatasetFileColumn[]> {
    const buffer = await this.fileStorageService.readFile(document.storageRelativePath)
    const csvContent = buffer.toString("utf-8")

    const parsed = Papa.parse(csvContent, {
      header: true,
      preview: 5,
      skipEmptyLines: true,
    })

    if (!parsed.meta.fields || parsed.meta.fields.length === 0) {
      throw new UnprocessableEntityException("CSV file has no columns")
    }

    return parsed.meta.fields.map((fieldName) => ({
      id: v4(),
      name: fieldName,
      sampleValues: (parsed.data as Record<string, unknown>[]).map((row) => row[fieldName]),
    }))
  }
}
