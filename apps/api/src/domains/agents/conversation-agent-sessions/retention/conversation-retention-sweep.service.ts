import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { LangfuseAdminService } from "@/external/langfuse/langfuse-admin"
import { ConversationAgentSession } from "../conversation-agent-session.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ConversationAgentSessionPurgeService } from "./conversation-agent-session-purge.service"
import { CONVERSATION_RETENTION_SWEEP_BATCH_LIMIT } from "./conversation-retention.constants"

@Injectable()
export class ConversationRetentionSweepService {
  private readonly logger = new Logger(ConversationRetentionSweepService.name)

  constructor(
    @InjectRepository(ConversationAgentSession)
    private readonly sessionRepository: Repository<ConversationAgentSession>,
    private readonly purgeService: ConversationAgentSessionPurgeService,
    private readonly langfuseAdminService: LangfuseAdminService,
  ) {}

  async sweepExpiredConversations(): Promise<{ purgedCount: number }> {
    const expiredSessions = await this.sessionRepository
      .createQueryBuilder("session")
      // Joined by table name: importing the Project entity here would be a
      // cross-domain entity import (no-cross-domain-entity-import).
      .innerJoin("project", "project", "project.id = session.project_id")
      .where("project.conversation_retention_days IS NOT NULL")
      .andWhere("session.purged_at IS NULL")
      .andWhere(
        "session.created_at < now() - (project.conversation_retention_days * interval '1 day')",
      )
      .orderBy("session.created_at", "ASC")
      .limit(CONVERSATION_RETENTION_SWEEP_BATCH_LIMIT)
      .getMany()

    let purgedCount = 0
    for (const session of expiredSessions) {
      const { purged } = await this.purgeService.purgeSessionContent(session.id)
      if (!purged) continue
      purgedCount += 1

      if (session.traceId) {
        try {
          await this.langfuseAdminService.deleteTrace(session.traceId)
        } catch (error) {
          // DB content is already purged; the trace retries on the next sweep
          // is not possible (purged_at is set), so log loudly for follow-up.
          this.logger.error(
            `Langfuse trace deletion failed for session ${session.id} (trace ${session.traceId}): ${(error as Error).message}`,
          )
        }
      }
    }

    if (purgedCount > 0) {
      this.logger.log(`Retention sweep purged ${purgedCount} conversation session(s).`)
    }
    return { purgedCount }
  }
}
