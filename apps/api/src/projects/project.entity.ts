import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"
import { Organization } from "@/organizations/organization.entity"

@Entity("projects")
export class Project {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ type: "varchar" })
  name!: string

  @Column({ type: "uuid", name: "organization_id" })
  organizationId!: string

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date

  @ManyToOne(
    () => Organization,
    (organization) => organization.projects,
  )
  @JoinColumn({ name: "organization_id" })
  organization!: Organization
}
