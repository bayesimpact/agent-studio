import { Column, JoinColumn, ManyToOne } from "typeorm"
import { ConnectEntity, ConnectEntityBase } from "@/common/entities/connect-entity"
import { Organization } from "@/domains/organizations/organization.entity"
import { Project } from "@/domains/projects/project.entity"

@ConnectEntity("agent_message_attachment_document", "createdAt")
export class AgentMessageAttachmentDocument extends ConnectEntityBase {
  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: "organization_id" })
  organization!: Organization

  @ManyToOne(() => Project, { nullable: false })
  @JoinColumn({ name: "project_id" })
  project!: Project

  @Column({ type: "varchar", name: "file_name" })
  fileName!: string

  @Column({ type: "varchar", name: "mime_type" })
  mimeType!: string

  @Column({ type: "integer" })
  size!: number

  @Column({ type: "varchar", name: "storage_relative_path" })
  storageRelativePath!: string
}
