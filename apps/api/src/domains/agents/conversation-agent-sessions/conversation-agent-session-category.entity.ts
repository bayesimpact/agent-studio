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
import { AgentCategory } from "@/domains/agents/categories/agent-category.entity"
import { ConversationAgentSession } from "./conversation-agent-session.entity"

@Entity("conversation_agent_session_category")
@Unique(["conversationAgentSessionId", "agentCategoryId"])
export class ConversationAgentSessionCategory {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ type: "uuid", name: "conversation_agent_session_id" })
  conversationAgentSessionId!: string

  @Column({ type: "uuid", name: "agent_category_id" })
  agentCategoryId!: string

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date

  @ManyToOne(
    () => ConversationAgentSession,
    (conversationAgentSession) => conversationAgentSession.sessionCategories,
    { onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "conversation_agent_session_id" })
  conversationAgentSession!: ConversationAgentSession

  @ManyToOne(
    () => AgentCategory,
    (agentCategory) => agentCategory.sessionCategories,
    { onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "agent_category_id" })
  agentCategory!: AgentCategory
}
