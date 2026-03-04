import { Column } from "typeorm"
import { ConnectEntity, ConnectEntityBase } from "@/common/entities/connect-entity"
import type { BaseAgentSessionType } from "../base-agent-sessions/base-agent-sessions.types"

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
}
