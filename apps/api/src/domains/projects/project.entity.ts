import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm"
import { Base4AllEntity } from "@/common/entities/base4all.entity"
import { Agent } from "@/domains/agents/agent.entity"
import { AgentMessageFeedback } from "@/domains/conversation-agent-sessions/messages/feedback/agent-message-feedback.entity"
import { Document } from "@/domains/documents/document.entity"
import { Organization } from "@/domains/organizations/organization.entity"
import { Evaluation } from "../evaluations/evaluation.entity"
import { ProjectMembership } from "./memberships/project-membership.entity"

@Entity("project")
export class Project extends Base4AllEntity {
  @Column({ type: "varchar" })
  name!: string

  @Column({ type: "uuid", name: "organization_id" })
  organizationId!: string

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
    () => Document,
    (document) => document.project,
  )
  documents!: Document[]

  @OneToMany(
    () => Evaluation,
    (evaluation) => evaluation.project,
  )
  evaluations!: Evaluation[]

  @OneToMany(
    () => AgentMessageFeedback,
    (agentMessageFeedback) => agentMessageFeedback.project,
  )
  agentMessageFeedbacks!: AgentMessageFeedback[]

  @OneToMany(
    () => ProjectMembership,
    (projectMembership) => projectMembership.project,
  )
  projectMemberships!: ProjectMembership[]
}
