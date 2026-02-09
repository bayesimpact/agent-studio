import { Column, Entity, JoinColumn, ManyToOne } from "typeorm"
import { Base4AllEntity } from "@/common/entities/base4all.entity"
import { AgentMessage } from "@/domains/agent-sessions/agent-message.entity"
import { Organization } from "@/domains/organizations/organization.entity"
import { Project } from "@/domains/projects/project.entity"
import { User } from "@/domains/users/user.entity"

@Entity({ name: "agent_message_feedback" })
export class AgentMessageFeedback extends Base4AllEntity {
  @Column({ type: "uuid", name: "organization_id" })
  organizationId!: string
  @ManyToOne(
    () => Organization,
    (organization) => organization.agentMessageFeedbacks,
  )
  @JoinColumn({ name: "organization_id" })
  organization!: Organization

  @Column({ type: "uuid", name: "project_id" })
  projectId!: string
  @ManyToOne(
    () => Project,
    (project) => project.agentMessageFeedbacks,
  )
  @JoinColumn({ name: "project_id" })
  project!: Project

  @Column({ type: "uuid", name: "agent_message_id" })
  agentMessageId!: string
  @ManyToOne(
    () => AgentMessage,
    (agentMessage) => agentMessage.agentMessageFeedbacks,
  )
  @JoinColumn({ name: "agent_message_id" })
  agentMessage!: AgentMessage

  @Column({ type: "uuid", name: "user_id" })
  userId!: string
  @ManyToOne(
    () => User,
    (user) => user.agentMessageFeedbacks,
  )
  @JoinColumn({ name: "user_id" })
  user!: User

  @Column({ name: "content", nullable: false })
  content!: string
}
