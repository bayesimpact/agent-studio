import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"
import { Agent } from "@/agents/agent.entity"
import { Organization } from "@/organizations/organization.entity"
import { User } from "@/users/user.entity"
import { ChatMessage } from "./chat-message.entity"

export type AgentSessionType = "playground" | "production" | "app-private"

@Entity("agent_session")
@Index(["agentId", "type"])
@Index(["organizationId", "type"])
@Index(["expiresAt"])
export class AgentSession {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ type: "uuid", name: "agent_id" })
  agentId!: string

  @Column({ type: "uuid", name: "user_id" })
  userId!: string

  @Column({ type: "uuid", name: "organization_id" })
  organizationId!: string

  @Column({ type: "varchar" })
  type!: AgentSessionType

  @Column({ type: "timestamp", nullable: true, name: "expires_at" }) // FIXME: to be removed
  expiresAt!: Date | null

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date

  @ManyToOne(
    () => Agent,
    (agent) => agent.agentSessions,
  )
  @JoinColumn({ name: "agent_id" })
  agent!: Agent

  @ManyToOne(
    () => User,
    (user) => user.agentSessions,
  )
  @JoinColumn({ name: "user_id" })
  user!: User

  @ManyToOne(
    () => Organization,
    (organization) => organization.agentSessions,
  )
  @JoinColumn({ name: "organization_id" })
  organization!: Organization

  @OneToMany(
    () => ChatMessage,
    (message) => message.session,
  )
  messages!: ChatMessage[]
}
