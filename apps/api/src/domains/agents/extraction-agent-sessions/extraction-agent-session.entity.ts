import type { ExtractionAgentSessionStatus } from "@caseai-connect/api-contracts"
import { Column, JoinColumn, ManyToOne } from "typeorm"
import { ConnectEntity, ConnectEntityBase } from "@/common/entities/connect-entity"
import { Document } from "@/domains/documents/document.entity"
import { User } from "@/domains/users/user.entity"
import { Agent } from "../agent.entity"
import type { BaseAgentSessionType } from "../base-agent-sessions/base-agent-sessions.types"

@ConnectEntity("extraction_agent_session", "agentId", "createdAt")
export class ExtractionAgentSession extends ConnectEntityBase {
  @Column({ type: "uuid", name: "agent_id" })
  agentId!: string

  @Column({ type: "uuid", name: "user_id" })
  userId!: string

  @Column({ type: "uuid", name: "document_id" })
  documentId!: string

  @Column({ type: "varchar" })
  status!: ExtractionAgentSessionStatus

  @Column({ type: "varchar" })
  type!: BaseAgentSessionType

  @Column({ type: "jsonb", nullable: true })
  result!: Record<string, unknown> | null

  @Column({ type: "varchar", nullable: true, name: "error_code" })
  errorCode!: string | null

  @Column({ type: "jsonb", nullable: true, name: "error_details" })
  errorDetails!: Record<string, unknown> | null

  @Column({ type: "text", name: "effective_prompt" })
  effectivePrompt!: string

  @Column({ type: "jsonb", name: "schema_snapshot" })
  schemaSnapshot!: Record<string, unknown>

  @Column({ type: "uuid", name: "trace_id" })
  traceId!: string

  @ManyToOne(
    () => Agent,
    (agent) => agent.extractionSessions,
    { onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "agent_id" })
  agent!: Agent

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User

  @ManyToOne(() => Document)
  @JoinColumn({ name: "document_id" })
  document!: Document
}
