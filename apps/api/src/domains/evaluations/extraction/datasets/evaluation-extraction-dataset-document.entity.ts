import { Column, Entity, JoinColumn, ManyToOne, Unique } from "typeorm"
import { Base4AllEntity } from "@/common/entities/base4all.entity"
import { Document } from "@/domains/documents/document.entity"
import { EvaluationExtractionDataset } from "./evaluation-extraction-dataset.entity"

@Entity("evaluation_extraction_dataset_document")
@Unique(["evaluationExtractionDatasetId", "documentId"])
export class EvaluationExtractionDatasetDocument extends Base4AllEntity {
  @Column({ type: "uuid", name: "evaluation_extraction_dataset_id" })
  evaluationExtractionDatasetId!: string
  @ManyToOne(
    () => EvaluationExtractionDataset,
    (evaluationExtractionDataset) =>
      evaluationExtractionDataset.evaluationExtractionDatasetDocuments,
  )
  @JoinColumn({ name: "evaluation_extraction_dataset_id" })
  evaluationExtractionDataset!: EvaluationExtractionDataset

  @Column({ type: "uuid", name: "document_id" })
  documentId!: string
  @ManyToOne(
    () => Document,
    (document) => document.evaluationExtractionDatasetDocuments,
  )
  @JoinColumn({ name: "document_id" })
  document!: Document
}
