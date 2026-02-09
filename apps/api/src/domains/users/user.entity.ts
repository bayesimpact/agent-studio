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
import { UserMembership } from "@/domains/organizations/user-membership.entity"

@Entity("user")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ type: "varchar", unique: true, name: "auth0_id" })
  auth0Id!: string

  @Column({ type: "varchar" })
  email!: string

  @Column({ type: "varchar", nullable: true })
  name!: string | null

  @Column({ type: "varchar", nullable: true, name: "picture_url" })
  pictureUrl!: string | null

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date

  @OneToMany(
    () => UserMembership,
    (membership) => membership.user,
  )
  memberships!: UserMembership[]

  @OneToMany(
    () => AgentSession,
    (agentSession) => agentSession.user,
  )
  agentSessions!: AgentSession[]

  @OneToMany(
    () => AgentMessageFeedback,
    (agentMessageFeedback) => agentMessageFeedback.user,
  )
  agentMessageFeedbacks!: AgentMessageFeedback[]
}
