import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm"
import { User } from "@/domains/users/user.entity"
import { Project } from "./project.entity"

export type ProjectMembershipStatus = "sent" | "accepted"

@Entity("project_membership")
@Unique(["projectId", "userId"])
export class ProjectMembership {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ type: "uuid", name: "project_id" })
  projectId!: string

  @Column({ type: "uuid", name: "user_id" })
  userId!: string

  @Column({ type: "varchar", name: "invitation_token", unique: true })
  invitationToken!: string

  @Column({ type: "varchar", default: "sent" })
  status!: ProjectMembershipStatus

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date

  @ManyToOne(
    () => Project,
    (project) => project.projectMemberships,
  )
  @JoinColumn({ name: "project_id" })
  project!: Project

  @ManyToOne(
    () => User,
    (user) => user.projectMemberships,
  )
  @JoinColumn({ name: "user_id" })
  user!: User
}
