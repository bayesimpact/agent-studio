import { Column, JoinColumn, ManyToOne } from "typeorm"
import { ConnectEntity, ConnectEntityBase } from "@/common/entities/connect-entity"
import { Project } from "@/domains/projects/project.entity"

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
  sourceType!: "project" | "agentSessionMessage" | "extraction"
}
