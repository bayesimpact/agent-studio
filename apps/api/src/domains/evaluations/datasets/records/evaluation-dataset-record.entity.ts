import { Column, JoinColumn, ManyToOne } from "typeorm"
import { ConnectEntity, ConnectEntityBase } from "@/common/entities/connect-entity"
import { EvaluationDataset } from "../evaluation-dataset.entity"

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

  @Column({ name: "data", nullable: true, type: "jsonb" })
  data!: Record<string, unknown> | null
}
