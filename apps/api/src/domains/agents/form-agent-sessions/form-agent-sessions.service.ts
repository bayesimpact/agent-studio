import { Inject, Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { v4 } from "uuid"
import { z } from "zod"
import { ConnectRepository } from "@/common/entities/connect-repository"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import type { LLMProvider } from "@/common/interfaces/llm-provider.interface"
import type { Agent } from "@/domains/agents/agent.entity"
import { FILE_STORAGE_SERVICE } from "@/domains/documents/storage/file-storage.interface"
import { ServiceWithLLM } from "@/external/llm"
import type { BaseAgentSessionType } from "../base-agent-sessions/base-agent-sessions.types"
import { fillFormTool } from "../shared/agent-session-messages/streaming/tools/fill-form.tool"
import { FormAgentSession } from "./form-agent-session.entity"

@Injectable()
export class FormAgentSessionsService extends ServiceWithLLM {
  private readonly sessionConnectRepository: ConnectRepository<FormAgentSession>
  private readonly formAgentSessionRepository: Repository<FormAgentSession>
  constructor(
    @InjectRepository(FormAgentSession)
    formAgentSessionRepository: Repository<FormAgentSession>,
    @Inject(FILE_STORAGE_SERVICE)
    @Inject("_MockLLMProvider")
    mockLlmProvider: LLMProvider,
    @Inject("VertexLLMProvider")
    vertexLlmProvider: LLMProvider,
  ) {
    super(mockLlmProvider, vertexLlmProvider)
    this.formAgentSessionRepository = formAgentSessionRepository
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
    type,
  }: {
    connectScope: RequiredConnectScope
    agentId: string
    type: BaseAgentSessionType
  }): Promise<FormAgentSession> {
    return await this.sessionConnectRepository.createAndSave(connectScope, {
      agentId,
      userId: connectScope.userId,
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

  buildFillFormTool({
    agent,
    sessionId,
    sendClientEvent,
  }: {
    agent: Agent
    sessionId: string
    sendClientEvent: (event: MessageEvent) => void
  }) {
    const isValid = this.isValidSchema(agent.outputJsonSchema)
    if (!isValid) {
      console.error(`Invalid output JSON schema for agent ${agent.id}`)
      return undefined
    }

    const agentOutputJsonSchema = agent.outputJsonSchema as AgentOutputJsonSchema
    const inputSchema = this.buildZodSchema(agentOutputJsonSchema.properties)

    const handleChange = async (value: Record<string, unknown>) => {
      const updated = await this.formAgentSessionRepository.update(sessionId, {
        // FIXME:
        // @ts-expect-error
        result: value,
      })
      if (!updated.affected) return

      sendClientEvent({
        data: JSON.stringify({
          type: "form_update",
          sessionId,
        }),
      } as MessageEvent)
    }
    return { fillForm: fillFormTool({ inputSchema, onExecute: handleChange }) }
  }

  // TODO: write a test for this method
  private buildZodSchema(
    properties: Record<string, { type: string; description: string }>,
  ): z.ZodObject<any> {
    const shape: Record<string, z.ZodTypeAny> = {}
    for (const [key, value] of Object.entries(properties)) {
      switch (value.type) {
        case "string":
          shape[key] = z.string().describe(value.description).optional()
          break
        case "number":
          shape[key] = z.number().describe(value.description).optional()
          break
        case "boolean":
          shape[key] = z.boolean().describe(value.description).optional()
          break
        default:
          throw new Error(`Unsupported property type: ${value.type}`)
      }
    }

    return z.object(shape).strict()
  }

  // TODO: write a test for this method
  private isValidSchema(schema: Record<string, unknown> | null): schema is {
    required: string[]
    properties: Record<string, { type: string; description: string }>
  } {
    if (!schema) {
      return false
    }

    if (
      !Array.isArray(schema.required) ||
      !schema.required.every((item) => typeof item === "string")
    ) {
      return false
    }

    if (
      typeof schema.properties !== "object" ||
      schema.properties === null ||
      Array.isArray(schema.properties)
    ) {
      return false
    }

    return Object.values(schema.properties as Record<string, unknown>).every(
      (prop) =>
        typeof prop === "object" &&
        prop !== null &&
        typeof (prop as Record<string, unknown>).type === "string" &&
        typeof (prop as Record<string, unknown>).description === "string",
    )
  }
}
type AgentOutputJsonSchema = {
  required: string[]
  properties: Record<string, { type: string; description: string }>
}
