import { Column, Entity, OneToMany } from "typeorm"
import { Base4AllEntity } from "@/common/entities/base4all.entity"
import { AgentMessageFeedback } from "@/domains/agent-message-feedback/agent-message-feedback.entity"
import { AgentSession } from "@/domains/agent-sessions/agent-session.entity"
import { Project } from "@/domains/projects/project.entity"
import { UserMembership } from "./user-membership.entity"

@Entity("organization")
export class Organization extends Base4AllEntity {
  @Column({ type: "varchar" })
  name!: string

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
