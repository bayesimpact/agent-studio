import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"
import { Agent } from "@/agents/agent.entity"
import { Organization } from "@/organizations/organization.entity"
import { Resource } from "@/resources/resource.entity"

@Entity("project")
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

  @OneToMany(
    () => Agent,
    (agent) => agent.project,
  )
  agents!: Agent[]

  @OneToMany(
    () => Resource,
    (resource) => resource.project,
  )
  resources!: Resource[]
}
