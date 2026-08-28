import { Column, Entity, Index } from "typeorm"
import { Base4AllEntity } from "@/common/entities/base4all.entity"

export type ConversationRetentionSweepRunStatus = "OK" | "PARTIAL" | "ERROR"

/**
 * Purge log: one row per sweep run and per project, zero counts included so
 * the log proves that the purge ran. Shown on the workspace admin page
 * (issue #677). The log keeps 12 months of rows; the sweep deletes older ones.
 */
@Entity("conversation_retention_sweep_run")
@Index(["projectId", "ranAt"])
export class ConversationRetentionSweepRun extends Base4AllEntity {
  // Plain uuid on purpose: a relation to Project would be a cross-domain
  // entity import (no-cross-domain-entity-import).
  @Column({ type: "uuid", name: "project_id" })
  projectId!: string

  @Column({ type: "timestamp", name: "ran_at" })
  ranAt!: Date

  @Column({ type: "integer", name: "purged_count", default: 0 })
  purgedCount!: number

  @Column({ type: "varchar" })
  status!: ConversationRetentionSweepRunStatus

  /** Run report in markdown: stats when OK, what failed when PARTIAL or ERROR. */
  @Column({ type: "text" })
  report!: string
}
