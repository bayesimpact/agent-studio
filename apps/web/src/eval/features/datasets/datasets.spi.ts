import type {
  EvaluationDatasetSchemaColumnDto,
  SuccessResponseDTO,
} from "@caseai-connect/api-contracts"
import type { DatasetFile, DatasetFileColumn, EvaluationDataset } from "./datasets.models"

type BaseParams = { organizationId: string; projectId: string }
export interface IDatasetsSpi {
  getAllFiles(params: BaseParams): Promise<DatasetFile[]>
  getAll(params: BaseParams): Promise<EvaluationDataset[]>
  createOne(params: BaseParams & { payload: { name: string } }): Promise<SuccessResponseDTO>
  updateOne(
    params: BaseParams & { datasetId: string; documentId: string } & {
      payload: {
        name: string
        columns: EvaluationDatasetSchemaColumnDto[]
      }
    },
  ): Promise<SuccessResponseDTO>
  getFileColumns(params: BaseParams & { documentId: string }): Promise<DatasetFileColumn[]>
}
