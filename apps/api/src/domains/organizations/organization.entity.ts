import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"
import { AgentMessageFeedback } from "@/domains/agent-message-feedback/agent-message-feedback.entity"
import { AgentSession } from "@/domains/agent-sessions/agent-session.entity"
import { Project } from "@/domains/projects/project.entity"
import { UserMembership } from "./user-membership.entity"

@Entity("organization")
export class Organization {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ type: "varchar" })
  name!: string

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date

  @OneToMany(
    () => UserMembership,
    (membership) => membership.organization,
  )
  memberships!: UserMembership[]

  @OneToMany(
    () => Project,
    (project) => project.organization,
  )
  projects!: Project[]

  @OneToMany(
    () => AgentSession,
    (agentSession) => agentSession.organization,
  )
  agentSessions!: AgentSession[]

  @OneToMany(
    () => AgentMessageFeedback,
    (agentMessageFeedback) => agentMessageFeedback.organization,
  )
  agentMessageFeedbacks!: AgentMessageFeedback[]
}
