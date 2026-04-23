import { Column, JoinColumn, ManyToOne, OneToMany } from "typeorm"
import { ConnectEntity, ConnectEntityBase } from "@/common/entities/connect-entity"
import { ReviewCampaign } from "@/domains/review-campaigns/review-campaign.entity"
import type { BaseAgentSessionType } from "../base-agent-sessions/base-agent-sessions.types"
import { AgentMessage } from "../shared/agent-session-messages/agent-message.entity"

@ConnectEntity("form_agent_session", "agentId", "type")
export class FormAgentSession extends ConnectEntityBase {
  @Column({ type: "uuid", name: "agent_id" })
  agentId!: string

  @Column({ type: "uuid", name: "trace_id", nullable: true })
  traceId!: string

  @Column({ type: "uuid", name: "user_id" })
  userId!: string

  @Column({ type: "varchar" })
  type!: BaseAgentSessionType

  @Column({ type: "jsonb", nullable: true })
  result!: Record<string, unknown> | null

  @OneToMany(
    () => AgentMessage,
    (message) => message.formAgentSession,
  )
  messages!: AgentMessage[]

  @Column({ type: "uuid", name: "campaign_id", nullable: true })
  campaignId!: string | null

  @ManyToOne(
    () => ReviewCampaign,
    (campaign) => campaign.formAgentSessions,
    { nullable: true },
  )
  @JoinColumn({ name: "campaign_id" })
  reviewCampaign?: ReviewCampaign | null
}
