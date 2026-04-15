import { Column, Entity, JoinColumn, ManyToOne, Unique } from "typeorm"
import { Base4AllEntity } from "@/common/entities/base4all.entity"
import { Document } from "@/domains/documents/document.entity"
import { EvaluationDataset } from "./evaluation-dataset.entity"

@Entity("evaluation_dataset_document")
@Unique(["evaluationDatasetId", "documentId"])
export class EvaluationDatasetDocument extends Base4AllEntity {
  @Column({ type: "uuid", name: "evaluation_dataset_id" })
  evaluationDatasetId!: string
  @ManyToOne(
    () => EvaluationDataset,
    (evaluationDataset) => evaluationDataset.evaluationDatasetDocuments,
  )
  @JoinColumn({ name: "evaluation_dataset_id" })
  evaluationDataset!: EvaluationDataset

  @Column({ type: "uuid", name: "document_id" })
  documentId!: string
  @ManyToOne(
    () => Document,
    (document) => document.evaluationDatasetDocuments,
  )
  @JoinColumn({ name: "document_id" })
  document!: Document
}
