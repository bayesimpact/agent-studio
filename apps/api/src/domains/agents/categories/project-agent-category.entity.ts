import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique } from "typeorm"
import { Base4AllEntity } from "@/common/entities/base4all.entity"
import { ConversationAgentSessionCategory } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session-category.entity"
import { Project } from "@/domains/projects/project.entity"
import { AgentCategory } from "./agent-category.entity"

@Entity("project_agent_category")
@Unique(["projectId", "name"])
export class ProjectAgentCategory extends Base4AllEntity {
  @Column({ type: "uuid", name: "project_id" })
  projectId!: string

  @Column({ type: "varchar" })
  name!: string

  @ManyToOne(
    () => Project,
    (project) => project.projectAgentCategories,
    { onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "project_id" })
  project!: Project

  @OneToMany(
    () => AgentCategory,
    (agentCategory) => agentCategory.projectAgentCategory,
  )
  agentCategories!: AgentCategory[]

  @OneToMany(
    () => ConversationAgentSessionCategory,
    (conversationAgentSessionCategory) => conversationAgentSessionCategory.projectAgentCategory,
  )
  sessionCategories!: ConversationAgentSessionCategory[]
}
