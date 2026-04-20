import { Inject, Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ConnectRepository } from "@/common/entities/connect-repository"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import type { MulterFile } from "@/common/types"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DocumentsService } from "@/domains/documents/documents.service"
import type { IFileStorage } from "@/domains/documents/storage/file-storage.interface"
import { FILE_STORAGE_SERVICE } from "@/domains/documents/storage/file-storage.interface"
import { EvaluationExtractionDataset } from "../datasets/evaluation-extraction-dataset.entity"
import type { EvaluationExtractionDatasetRecord } from "../datasets/records/evaluation-extraction-dataset-record.entity"
import { EvaluationExtractionRun } from "./evaluation-extraction-run.entity"
import {
  buildEvaluationRunCsv,
  buildEvaluationRunCsvFileName,
} from "./evaluation-extraction-run-csv-builder"
import { EvaluationExtractionRunRecord } from "./records/evaluation-extraction-run-record.entity"

const CSV_MIME_TYPE = "text/csv"
const CSV_EXTENSION = "csv"

@Injectable()
export class EvaluationExtractionRunCsvExportService {
  private readonly logger = new Logger(EvaluationExtractionRunCsvExportService.name)
  private readonly datasetConnectRepository: ConnectRepository<EvaluationExtractionDataset>
  private readonly runRecordConnectRepository: ConnectRepository<EvaluationExtractionRunRecord>
  private readonly runRepository: Repository<EvaluationExtractionRun>

  constructor(
    @InjectRepository(EvaluationExtractionDataset)
    datasetRepository: Repository<EvaluationExtractionDataset>,
    @InjectRepository(EvaluationExtractionRun)
    runRepository: Repository<EvaluationExtractionRun>,
    @InjectRepository(EvaluationExtractionRunRecord)
    runRecordRepository: Repository<EvaluationExtractionRunRecord>,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorage,
    private readonly documentsService: DocumentsService,
  ) {
    this.datasetConnectRepository = new ConnectRepository(
      datasetRepository,
      "evaluationExtractionDataset",
    )
    this.runRecordConnectRepository = new ConnectRepository(
      runRecordRepository,
      "evaluationExtractionRunRecord",
    )
    this.runRepository = runRepository
  }

  async generateAndStoreDocument(run: EvaluationExtractionRun): Promise<void> {
    const connectScope: RequiredConnectScope = {
      organizationId: run.organizationId,
      projectId: run.projectId,
    }

    const dataset = await this.datasetConnectRepository.getOneById(
      connectScope,
      run.evaluationExtractionDatasetId,
    )
    if (!dataset) {
      this.logger.warn(
        `Skipping CSV export for run ${run.id}: dataset ${run.evaluationExtractionDatasetId} not found`,
      )
      return
    }

    const records = await this.runRecordConnectRepository.find(connectScope, {
      where: { evaluationExtractionRunId: run.id },
      relations: ["evaluationExtractionDatasetRecord"],
      order: { createdAt: "ASC" },
    })

    const typedRecords = records.filter(
      (
        record,
      ): record is typeof record & {
        evaluationExtractionDatasetRecord: EvaluationExtractionDatasetRecord
      } => Boolean(record.evaluationExtractionDatasetRecord),
    )

    const csvBuffer = buildEvaluationRunCsv({ dataset, run, records: typedRecords })
    const fileName = buildEvaluationRunCsvFileName({ datasetName: dataset.name, runId: run.id })

    const fileInfo = await this.fileStorageService.save({
      connectScope,
      extension: CSV_EXTENSION,
      file: {
        buffer: csvBuffer,
        mimetype: CSV_MIME_TYPE,
        originalname: fileName,
        size: csvBuffer.byteLength,
      } as MulterFile,
    })

    const document = await this.documentsService.createDocument({
      connectScope,
      documentId: fileInfo.fileId,
      uploadStatus: "uploaded",
      fields: {
        fileName,
        mimeType: CSV_MIME_TYPE,
        size: csvBuffer.byteLength,
        storageRelativePath: fileInfo.storageRelativePath,
        title: fileName,
        sourceType: "evaluationExtractionRun",
      },
    })

    await this.runRepository.update(run.id, { csvExportDocumentId: document.id })
    run.csvExportDocumentId = document.id
  }

  async findExportDocumentId(run: EvaluationExtractionRun): Promise<string | null> {
    const link = await this.runRepository.findOne({
      where: { id: run.id },
      select: ["csvExportDocumentId"],
    })
    return link?.csvExportDocumentId ?? null
  }
}
