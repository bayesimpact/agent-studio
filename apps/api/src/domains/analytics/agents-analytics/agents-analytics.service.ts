import type { TimeType } from "@caseai-connect/api-contracts"
import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ConnectRepository } from "@/common/entities/connect-repository"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import { ConversationAgentSession } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session.entity"
import { AgentMessage } from "@/domains/agents/shared/agent-session-messages/agent-message.entity"
import {
  getDayKeySql,
  getQualifiedColumnSql,
  getUtcDayKeys,
} from "@/domains/analytics/shared/analytics-conversation-metrics.helpers"

import type { AnalyticsDailyPoint } from "../projects-analytics/projects-analytics.types"

@Injectable()
export class AgentsAnalyticsService {
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
    agentId,
    startAt,
    endAt,
  }: {
    connectScope: RequiredConnectScope
    agentId: string
    startAt: TimeType
    endAt: TimeType
  }): Promise<AnalyticsDailyPoint[]> {
    const dayKeys = getUtcDayKeys(startAt, endAt)
    const dayExpr = getDayKeySql(this.conversationAgentSessionAlias, "created_at")
    const createdAtCol = getQualifiedColumnSql(this.conversationAgentSessionAlias, "created_at")
    const agentIdCol = getQualifiedColumnSql(this.conversationAgentSessionAlias, "agent_id")

    const raw = await this.conversationAgentSessionConnectRepository
      .newQueryBuilderWithConnectScope(connectScope)
      .andWhere(`${agentIdCol} = :agentId`, { agentId })
      .select(dayExpr, "date")
      .addSelect("COUNT(*)::int", "value")
      .andWhere(`${createdAtCol} BETWEEN :startAt AND :endAt`, {
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
    agentId,
    startAt,
    endAt,
  }: {
    connectScope: RequiredConnectScope
    agentId: string
    startAt: TimeType
    endAt: TimeType
  }): Promise<AnalyticsDailyPoint[]> {
    const dayKeys = getUtcDayKeys(startAt, endAt)

    const dayExpr = getDayKeySql(this.conversationAgentSessionAlias, "created_at")
    const createdAtCol = getQualifiedColumnSql(this.conversationAgentSessionAlias, "created_at")
    const conversationIdCol = getQualifiedColumnSql(this.conversationAgentSessionAlias, "id")
    const agentMessageIdCol = getQualifiedColumnSql(this.agentMessageAlias, "id")
    const agentIdCol = getQualifiedColumnSql(this.conversationAgentSessionAlias, "agent_id")

    const raw = await this.conversationAgentSessionConnectRepository
      .newQueryBuilderWithConnectScope(connectScope)
      .andWhere(`${agentIdCol} = :agentId`, { agentId })
      .leftJoin(
        AgentMessage,
        this.agentMessageAlias,
        `${getQualifiedColumnSql(this.agentMessageAlias, "session_id")} = ${getQualifiedColumnSql(this.conversationAgentSessionAlias, "id")}
          AND ${getQualifiedColumnSql(this.agentMessageAlias, "role")} = :userRole`,
        { userRole: "user" },
      )
      .select(dayExpr, "date")
      .addSelect(
        `COALESCE((COUNT(${agentMessageIdCol})::float / NULLIF(COUNT(DISTINCT ${conversationIdCol}), 0)), 0)`,
        "value",
      )
      .andWhere(`${createdAtCol} BETWEEN :startAt AND :endAt`, {
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
}
