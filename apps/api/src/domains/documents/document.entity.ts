import { Column, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany } from "typeorm"
import { ConnectEntity, ConnectEntityBase } from "@/common/entities/connect-entity"
import { EvaluationDatasetDocument } from "@/domains/evaluations/datasets/evaluation-dataset-document.entity"
import { Project } from "@/domains/projects/project.entity"
import type { DocumentTag } from "./tags/document-tag.entity"

@ConnectEntity("document")
export class Document extends ConnectEntityBase {
  @ManyToOne(
    () => Project,
    (project) => project.documents,
  )
  @JoinColumn({ name: "project_id" })
  project!: Project

  @Column({ name: "title", nullable: false })
  title!: string // can be different from the file name OR be the same OR be empty

  @Column({ name: "content", nullable: true })
  content!: string

  @Column({ name: "file_name", nullable: true })
  fileName!: string // The original name of the file as it is stored

  @Column({ name: "language", nullable: false, default: "en" })
  language!: string

  @Column({ name: "mime_type", nullable: false })
  mimeType!: string

  @Column({ name: "size", nullable: true })
  size!: number // Size in bytes

  @Column({ name: "storage_relative_path", nullable: true })
  storageRelativePath!: string

  @Column({ name: "source_type", nullable: false })
  sourceType!: "project" | "agentSessionMessage" | "extraction" | "evaluationDataset"

  @Column({ name: "embedding_status", nullable: false, default: "pending" })
  embeddingStatus!: "pending" | "processing" | "completed" | "failed"

  @Column({ name: "extraction_engine", type: "varchar", nullable: true })
  extractionEngine!: string | null

  @Column({ name: "upload_status", nullable: false, default: "uploaded" })
  uploadStatus!: "pending" | "uploaded"

  @ManyToMany("DocumentTag", (tag: DocumentTag) => tag.documents)
  @JoinTable({
    name: "document_document_tag",
    joinColumn: { name: "document_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "document_tag_id", referencedColumnName: "id" },
  })
  tags!: DocumentTag[]

  @OneToMany(
    () => EvaluationDatasetDocument,
    (evaluationDatasetDocument: EvaluationDatasetDocument) => evaluationDatasetDocument.document,
  )
  evaluationDatasetDocuments!: EvaluationDatasetDocument[]
}
