import { Column, Entity, JoinColumn, ManyToOne } from "typeorm"
import { Base4AllEntity } from "@/common/entities/base4all.entity"
import { Project } from "@/domains/projects/project.entity"

@Entity("resource")
export class Resource extends Base4AllEntity {
  @Column({ type: "uuid", name: "project_id" })
  projectId!: string

  @ManyToOne(
    () => Project,
    (project) => project.resources,
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
}
