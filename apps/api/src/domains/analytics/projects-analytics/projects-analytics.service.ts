import type { TimeType } from "@caseai-connect/api-contracts"
import { BadRequestException, Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ConnectRepository } from "@/common/entities/connect-repository"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import { ConversationAgentSession } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session.entity"
import { AgentMessage } from "@/domains/agents/shared/agent-session-messages/agent-message.entity"

import type { AnalyticsDailyPoint } from "./projects-analytics.types"

@Injectable()
export class ProjectsAnalyticsService {
  private readonly conversationAgentSessionConnectRepository: ConnectRepository<ConversationAgentSession>
  private readonly conversationAgentSessionAlias = "conversationAgentSession"
  private readonly agentMessageAlias = "agentMessage"

  constructor(
    @InjectRepository(ConversationAgentSession)
    conversationAgentSessionRepository: Repository<ConversationAgentSession>,
  ) {
    this.conversationAgentSessionConnectRepository = new ConnectRepository(
      conversationAgentSessionRepository,
      this.conversationAgentSessionAlias,
    )
  }

  async getConversationsPerDay({
    connectScope,
    startAt,
    endAt,
  }: {
    connectScope: RequiredConnectScope
    startAt: TimeType
    endAt: TimeType
  }): Promise<AnalyticsDailyPoint[]> {
    const dayKeys = this.getUtcDayKeys(startAt, endAt)
    const dayExpr = this.getDayKeySql(this.conversationAgentSessionAlias, "created_at")
    const createdAtCol = this.getQualifiedColumnSql(
      this.conversationAgentSessionAlias,
      "created_at",
    )

    const raw = await this.conversationAgentSessionConnectRepository
      .newQueryBuilderWithConnectScope(connectScope)
      .select(dayExpr, "date")
      .addSelect("COUNT(*)::int", "value")
      .where(`${createdAtCol} BETWEEN :startAt AND :endAt`, {
        startAt: new Date(startAt),
        endAt: new Date(endAt),
      })
      .groupBy(dayExpr)
      .orderBy("date", "ASC")
      .getRawMany<{
        date: string
        value: string
      }>()

    const valueByDay = new Map(raw.map((row) => [row.date, Number(row.value)]))

    return dayKeys.map((day) => ({
      date: day,
      value: valueByDay.get(day) ?? 0,
    }))
  }

  async getAvgUserQuestionsPerSessionPerDay({
    connectScope,
    startAt,
    endAt,
  }: {
    connectScope: RequiredConnectScope
    startAt: TimeType
    endAt: TimeType
  }): Promise<AnalyticsDailyPoint[]> {
    const dayKeys = this.getUtcDayKeys(startAt, endAt)

    const dayExpr = this.getDayKeySql(this.conversationAgentSessionAlias, "created_at")
    const createdAtCol = this.getQualifiedColumnSql(
      this.conversationAgentSessionAlias,
      "created_at",
    )
    const conversationIdCol = this.getQualifiedColumnSql(this.conversationAgentSessionAlias, "id")
    const agentMessageIdCol = this.getQualifiedColumnSql(this.agentMessageAlias, "id")

    const raw = await this.conversationAgentSessionConnectRepository
      .newQueryBuilderWithConnectScope(connectScope)
      .leftJoin(
        AgentMessage,
        this.agentMessageAlias,
        `${this.getQualifiedColumnSql(this.agentMessageAlias, "session_id")} = ${this.getQualifiedColumnSql(this.conversationAgentSessionAlias, "id")}
          AND ${this.getQualifiedColumnSql(this.agentMessageAlias, "role")} = :userRole`,
        { userRole: "user" },
      )
      .select(dayExpr, "date")
      .addSelect(
        `COALESCE((COUNT(${agentMessageIdCol})::float / NULLIF(COUNT(DISTINCT ${conversationIdCol}), 0)), 0)`,
        "value",
      )
      .where(`${createdAtCol} BETWEEN :startAt AND :endAt`, {
        startAt: new Date(startAt),
        endAt: new Date(endAt),
      })
      .groupBy(dayExpr)
      .orderBy("date", "ASC")
      .getRawMany<{
        date: string
        value: string
      }>()

    const valueByDay = new Map(raw.map((row) => [row.date, Number(row.value)]))

    return dayKeys.map((day) => ({
      date: day,
      value: valueByDay.get(day) ?? 0,
    }))
  }

  private getUtcDayKeys(startAt: TimeType, endAt: TimeType): string[] {
    if (endAt < startAt) {
      throw new BadRequestException("Invalid date range")
    }

    const startDate = new Date(startAt)
    const endDate = new Date(endAt)

    const startUtcDay = new Date(
      Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()),
    )
    const endUtcDay = new Date(
      Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()),
    )

    const days: string[] = []
    for (
      let current = startUtcDay;
      current.getTime() <= endUtcDay.getTime();
      current = new Date(current.getTime() + 24 * 60 * 60 * 1000)
    ) {
      days.push(current.toISOString().slice(0, 10))
    }

    return days
  }

  private getQualifiedColumnSql(alias: string, columnName: string): string {
    // Quote the alias to preserve case. Postgres folds unquoted identifiers to lowercase.
    return `"${alias}"."${columnName}"`
  }

  private getDayKeySql(alias: string, createdAtColumnName: string): string {
    // Match UTC day bucketing used by previous `toISOString().slice(0, 10)`.
    const createdAtCol = this.getQualifiedColumnSql(alias, createdAtColumnName)
    return `to_char(timezone('UTC', ${createdAtCol})::date, 'YYYY-MM-DD')`
  }
}
