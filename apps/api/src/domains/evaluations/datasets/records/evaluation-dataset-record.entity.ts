import { Column, JoinColumn, ManyToOne } from "typeorm"
import { ConnectEntity, ConnectEntityBase } from "@/common/entities/connect-entity"
import { EvaluationDataset } from "../evaluation-dataset.entity"

export type EvaluationDatasetRecordData = {
  [columnId: string]: unknown
}

@ConnectEntity("evaluation-dataset-record")
export class EvaluationDatasetRecord extends ConnectEntityBase {
  @Column({ type: "uuid", name: "evaluation_dataset_id", nullable: false })
  evaluationDatasetId!: string
  @ManyToOne(
    () => EvaluationDataset,
    (evaluationDataset) => evaluationDataset.records,
    { onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "evaluation_dataset_id" })
  evaluationDataset!: EvaluationDataset

  @Column({ name: "data", nullable: false, type: "jsonb" })
  data!: EvaluationDatasetRecordData
}
