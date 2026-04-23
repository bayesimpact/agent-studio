import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique } from "typeorm"
import { Base4AllEntity } from "@/common/entities/base4all.entity"
import { ConversationAgentSessionCategory } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session-category.entity"
import { Agent } from "../agent.entity"
import { ProjectAgentCategory } from "./project-agent-category.entity"

@Entity("agent_category")
@Unique(["agentId", "name"])
@Unique(["agentId", "projectAgentCategoryId"])
export class AgentCategory extends Base4AllEntity {
  @Column({ type: "uuid", name: "agent_id" })
  agentId!: string

  @Column({ type: "uuid", name: "project_agent_category_id", nullable: true })
  projectAgentCategoryId!: string | null

  @Column({ type: "varchar" })
  name!: string

  @ManyToOne(
    () => Agent,
    (agent) => agent.categories,
    { onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "agent_id" })
  agent!: Agent

  @ManyToOne(
    () => ProjectAgentCategory,
    (projectAgentCategory) => projectAgentCategory.agentCategories,
    { onDelete: "CASCADE", nullable: true },
  )
  @JoinColumn({ name: "project_agent_category_id" })
  projectAgentCategory!: ProjectAgentCategory | null

  @OneToMany(
    () => ConversationAgentSessionCategory,
    (conversationAgentSessionCategory) => conversationAgentSessionCategory.agentCategory,
  )
  sessionCategories!: ConversationAgentSessionCategory[]
}
