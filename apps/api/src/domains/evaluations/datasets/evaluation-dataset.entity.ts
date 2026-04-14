import { Column, JoinColumn, OneToMany, OneToOne } from "typeorm"
import { ConnectEntity, ConnectEntityBase } from "@/common/entities/connect-entity"
import { Document } from "@/domains/documents/document.entity"
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

@ConnectEntity("evaluation-dataset")
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

  @Column({ type: "uuid", name: "document_id", nullable: false })
  documentId!: string
  @OneToOne(() => Document, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "document_id" })
  document!: Document
}
