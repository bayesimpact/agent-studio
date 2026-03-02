import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { v4 } from "uuid"
import { ConnectRepository } from "@/common/entities/connect-repository"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import type { BaseAgentSessionType } from "../base-agent-sessions/base-agent-sessions.types"
import { FormAgentSession } from "./form-agent-session.entity"

@Injectable()
export class FormAgentSessionsService {
  private readonly sessionConnectRepository: ConnectRepository<FormAgentSession>
  constructor(
    @InjectRepository(FormAgentSession)
    formAgentSessionRepository: Repository<FormAgentSession>,
  ) {
    this.sessionConnectRepository = new ConnectRepository(
      formAgentSessionRepository,
      "formAgentSession",
    )
  }

  async listSessions({
    connectScope,
    agentId,
    type,
  }: {
    connectScope: RequiredConnectScope
    agentId: string
    type: BaseAgentSessionType
  }): Promise<FormAgentSession[]> {
    return this.sessionConnectRepository.find(connectScope, {
      where: { agentId, type },
      order: { createdAt: "DESC" },
    })
  }

  async createSession({
    connectScope,
    agentId,
    userId,
    type,
  }: {
    connectScope: RequiredConnectScope
    userId: string
    agentId: string
    type: BaseAgentSessionType
  }): Promise<FormAgentSession> {
    return await this.sessionConnectRepository.createAndSave(connectScope, {
      agentId,
      userId,
      type,
      traceId: v4(),
    })
  }

  async findSessionById({
    connectScope,
    sessionId,
    agentId,
    type,
  }: {
    connectScope: RequiredConnectScope
    sessionId: string
    agentId: string
    type: BaseAgentSessionType
  }): Promise<FormAgentSession | null> {
    const sessions = await this.sessionConnectRepository.find(connectScope, {
      where: { id: sessionId, agentId, type },
      take: 1,
    })
    const session = sessions[0]
    if (!session) return null
    return session
  }

  async updateSessionResult({
    connectScope,
    input,
    sessionId,
  }: {
    connectScope: RequiredConnectScope
    input: Record<string, unknown>
    sessionId: string
  }): Promise<{ result: Record<string, unknown> | null }> {
    const session = await this.sessionConnectRepository.getOneById(connectScope, sessionId)
    if (!session) return { result: null }

    session.result = { ...session.result, ...input } // mergedResult

    const updatedSession = await this.sessionConnectRepository.saveOne(session)

    return { result: updatedSession.result }
  }
}
