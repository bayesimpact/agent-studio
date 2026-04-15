import { Column, OneToMany } from "typeorm"
import { ConnectEntity, ConnectEntityBase } from "@/common/entities/connect-entity"
import type { EvaluationDatasetDocument } from "./evaluation-dataset-document.entity"
import { EvaluationDatasetRecord } from "./records/evaluation-dataset-record.entity"

export const COLUMN_ROLES = ["target", "input", "reference", "ignore"] as const
export type ColumnRole = (typeof COLUMN_ROLES)[number]
export type DatasetSchemaColumn = {
  finalName: string
  id: string
  index: number
  originalName: string
  role: ColumnRole
}
export type EvaluationDatasetSchemaMapping = Record<DatasetSchemaColumn["id"], DatasetSchemaColumn>

@ConnectEntity("evaluation_dataset")
export class EvaluationDataset extends ConnectEntityBase {
  @Column({ name: "name", nullable: false })
  name!: string

  @Column({ name: "schema_mapping", nullable: false, type: "jsonb" })
  schemaMapping!: EvaluationDatasetSchemaMapping

  @OneToMany(
    () => EvaluationDatasetRecord,
    (record) => record.evaluationDataset,
  )
  records!: EvaluationDatasetRecord[]

  @OneToMany(
    "EvaluationDatasetDocument",
    (evaluationDatasetDocument: EvaluationDatasetDocument) =>
      evaluationDatasetDocument.evaluationDataset,
  )
  evaluationDatasetDocuments!: EvaluationDatasetDocument[]
}
