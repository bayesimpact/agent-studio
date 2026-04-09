import { Column, Entity } from "typeorm"
import { Base4AllEntity } from "@/common/entities/base4all.entity"

@Entity("activity")
export class Activity extends Base4AllEntity {
  @Column({ type: "uuid", name: "organization_id" })
  organizationId!: string

  @Column({ type: "uuid", name: "project_id", nullable: true })
  projectId!: string | null

  @Column({ type: "uuid", name: "user_id" })
  userId!: string

  @Column({ type: "varchar" })
  action!: string

  @Column({ type: "uuid", name: "entity_id", nullable: true })
  entityId!: string | null

  @Column({ type: "varchar", name: "entity_type", nullable: true })
  entityType!: string | null
}
