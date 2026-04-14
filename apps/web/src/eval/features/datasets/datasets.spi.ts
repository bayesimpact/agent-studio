import type { EvaluationDatasetSchemaColumnDto } from "@caseai-connect/api-contracts"
import type { DatasetFile, DatasetFileColumn, EvaluationDataset } from "./datasets.models"

type BaseParams = { organizationId: string; projectId: string }
export interface IDatasetsSpi {
  getAllFiles(params: BaseParams): Promise<DatasetFile[]>
  createOne(
    params: BaseParams & {
      payload: { documentId: string; name: string; columns: EvaluationDatasetSchemaColumnDto[] }
    },
  ): Promise<EvaluationDataset>
  getColumns(params: BaseParams & { payload: { documentId: string } }): Promise<DatasetFileColumn[]>
}
