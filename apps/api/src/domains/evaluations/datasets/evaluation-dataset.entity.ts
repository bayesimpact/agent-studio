import { Column, JoinColumn, OneToMany, OneToOne } from "typeorm"
import { ConnectEntity, ConnectEntityBase } from "@/common/entities/connect-entity"
import { Document } from "@/domains/documents/document.entity"
import { EvaluationDatasetRecord } from "./records/evaluation-dataset-record.entity"

@ConnectEntity("evaluation-dataset")
export class EvaluationDataset extends ConnectEntityBase {
  @Column({ name: "name", nullable: false })
  name!: string

  @Column({ name: "schema_mapping", nullable: true, type: "jsonb" })
  schemaMapping!: Record<string, unknown> | null

  @OneToMany(
    () => EvaluationDatasetRecord,
    (record) => record.evaluationDataset,
  )
  records!: EvaluationDatasetRecord[]

  @Column({ type: "uuid", name: "document_id", nullable: true })
  documentId!: string | null
  @OneToOne(() => Document, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "document_id" })
  document!: Document | null
}
