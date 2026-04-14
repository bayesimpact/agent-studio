import type { Dataset, DatasetFile, DatasetFileColumn } from "./datasets.models"

type BaseParams = { organizationId: string; projectId: string }
export interface IDatasetsSpi {
  getAllFiles(params: BaseParams): Promise<DatasetFile[]>
  createOne(
    params: BaseParams & { payload: { documentId: string; name: string } },
  ): Promise<Dataset>
  getColumns(params: BaseParams & { payload: { documentId: string } }): Promise<DatasetFileColumn[]>
}
