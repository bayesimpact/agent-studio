import { Column, JoinColumn, ManyToOne, OneToMany } from "typeorm"
import { ConnectEntity, ConnectEntityBase } from "@/common/entities/connect-entity"
import { Agent } from "@/domains/agents/agent.entity"
import { Organization } from "@/domains/organizations/organization.entity"
import { User } from "@/domains/users/user.entity"
import { AgentMessage } from "../agent-sessions/messages/agent-message.entity"

export type AgentSessionType = "playground" | "production" | "app-private"

@ConnectEntity("agent_session", "agentId", "type")
export class AgentSession extends ConnectEntityBase {
  @Column({ type: "uuid", name: "agent_id" })
  agentId!: string

  @Column({ type: "uuid", name: "trace_id", nullable: true })
  traceId!: string

  @Column({ type: "uuid", name: "user_id" })
  userId!: string

  @Column({ type: "varchar" })
  type!: AgentSessionType

  @Column({ type: "timestamp", nullable: true, name: "expires_at" }) // FIXME: to be removed
  expiresAt!: Date | null

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
    () => AgentMessage,
    (message) => message.session,
  )
  messages!: AgentMessage[]
}
