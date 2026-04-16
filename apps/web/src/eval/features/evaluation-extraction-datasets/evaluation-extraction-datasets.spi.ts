import type {
  EvaluationExtractionDatasetSchemaColumnDto,
  SuccessResponseDTO,
} from "@caseai-connect/api-contracts"
import type {
  EvaluationExtractionDataset,
  EvaluationExtractionDatasetFile,
  EvaluationExtractionDatasetFileColumn,
} from "./evaluation-extraction-datasets.models"

type BaseParams = { organizationId: string; projectId: string }
export interface IEvaluationExtractionDatasetsSpi {
  getAllFiles(params: BaseParams): Promise<EvaluationExtractionDatasetFile[]>
  getAll(params: BaseParams): Promise<EvaluationExtractionDataset[]>
  createOne(params: BaseParams & { payload: { name: string } }): Promise<SuccessResponseDTO>
  updateOne(
    params: BaseParams & { datasetId: string; documentId: string } & {
      payload: {
        name: string
        columns: EvaluationExtractionDatasetSchemaColumnDto[]
      }
    },
  ): Promise<SuccessResponseDTO>
  getFileColumns(
    params: BaseParams & { documentId: string },
  ): Promise<EvaluationExtractionDatasetFileColumn[]>
}
