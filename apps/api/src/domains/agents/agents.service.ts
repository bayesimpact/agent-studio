import { Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ConnectRepository } from "@/common/entities/connect-repository"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ConversationAgentSessionsService } from "@/domains/agents/conversation-agent-sessions/conversation-agent-sessions.service"
import { Agent } from "./agent.entity"

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    agentRepository: Repository<Agent>,
    private readonly conversationAgentSessionsService: ConversationAgentSessionsService,
  ) {
    this.agentConnectRepository = new ConnectRepository(agentRepository, "agents")
  }
  private readonly agentConnectRepository: ConnectRepository<Agent>

  /**
   * Creates a new agent for a project.
   */
  async createAgent({
    connectScope,
    fields,
  }: {
    connectScope: RequiredConnectScope
    fields: Pick<RequiredConnectScope, never> &
      Pick<Agent, "defaultPrompt" | "name" | "model" | "temperature" | "locale"> &
      Partial<Pick<Agent, "type" | "outputJsonSchema">>
  }): Promise<Agent> {
    const { name, type = "conversation", outputJsonSchema = null } = fields

    // Validate name (min 3 characters)
    if (name.length < 3) {
      throw new UnprocessableEntityException("Agent name must be at least 3 characters long")
    }

    if (type === "extraction" && !outputJsonSchema) {
      throw new UnprocessableEntityException("Extraction agent requires outputJsonSchema")
    }

    // Create the agent with defaults
    return await this.agentConnectRepository.createAndSave(connectScope, {
      ...fields,
      type,
      outputJsonSchema,
    })
  }

  /**
   * Lists all agents for a project.
   */
  async listAgents(connectScope: RequiredConnectScope): Promise<Agent[]> {
    return (await this.agentConnectRepository.getMany(connectScope))?.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )
  }

  /**
   * Finds an agent by its id.
   */
  async findAgentById({
    connectScope,
    agentId,
  }: {
    connectScope: RequiredConnectScope
    agentId: string
  }): Promise<Agent | null> {
    return this.agentConnectRepository.getOneById(connectScope, agentId)
  }

  /**
   * Updates an agent.
   * Verifies that the user is an owner or admin of the agent's project's organization before updating.
   * Deletes playground sessions if configuration fields change.
   */
  async updateAgent({
    connectScope,
    required,
    fieldsToUpdate,
  }: {
    connectScope: RequiredConnectScope
    required: {
      agentId: string
    }
    fieldsToUpdate: Pick<RequiredConnectScope, never> &
      Partial<
        Pick<
          Agent,
          | "name"
          | "defaultPrompt"
          | "model"
          | "temperature"
          | "locale"
          | "type"
          | "outputJsonSchema"
        >
      >
  }): Promise<Agent> {
    const { agentId } = required
    const { name, defaultPrompt, model, temperature, locale, type } = fieldsToUpdate

    // Validate name if provided (min 3 characters)
    if (name !== undefined && name.length < 3) {
      throw new UnprocessableEntityException("Agent name must be at least 3 characters long")
    }

    // Find the agent
    const agent = await this.agentConnectRepository.getOneById(connectScope, agentId)

    if (!agent) {
      throw new NotFoundException(`Agent with id ${agentId} not found`)
    }

    const nextType = type ?? agent.type
    const nextOutputJsonSchema =
      fieldsToUpdate.outputJsonSchema !== undefined
        ? fieldsToUpdate.outputJsonSchema
        : agent.outputJsonSchema

    if (nextType === "extraction" && !nextOutputJsonSchema) {
      throw new UnprocessableEntityException("Extraction agent requires outputJsonSchema")
    }

    // Track if configuration fields changed (these trigger playground cleanup)
    const configFields = [
      { value: model, current: agent.model },
      { value: temperature, current: agent.temperature },
      { value: defaultPrompt, current: agent.defaultPrompt },
      { value: locale, current: agent.locale },
      { value: type, current: agent.type },
      { value: fieldsToUpdate.outputJsonSchema, current: agent.outputJsonSchema },
    ]
    const configChanged = configFields.some(
      ({ value, current }) => value !== undefined && value !== current,
    )

    // Update the agent
    Object.assign(agent, {
      ...(name !== undefined && { name }),
      ...(defaultPrompt !== undefined && { defaultPrompt }),
      ...(model !== undefined && { model }),
      ...(temperature !== undefined && { temperature }),
      ...(locale !== undefined && { locale }),
      ...(type !== undefined && { type }),
      ...(fieldsToUpdate.outputJsonSchema !== undefined && {
        outputJsonSchema: fieldsToUpdate.outputJsonSchema,
      }),
    })

    const updatedAgent = await this.agentConnectRepository.saveOne(agent)

    // If configuration changed, delete all playground sessions for this agent
    if (configChanged) {
      await this.conversationAgentSessionsService.deletePlaygroundSessionsForAgent(agentId)
    }

    return updatedAgent
  }

  /**
   * Deletes an agent.
   */
  async deleteAgent({
    connectScope,
    agentId,
  }: {
    connectScope: RequiredConnectScope
    agentId: string
  }): Promise<void> {
    // Find the agent
    const agent = await this.agentConnectRepository.getOneById(connectScope, agentId)

    if (!agent) {
      throw new NotFoundException(`Agent with id ${agentId} not found`)
    }

    // Delete all sessions for the agent
    await this.conversationAgentSessionsService.deleteAllSessionsForAgent(agentId)

    // Delete the agent
    await this.agentConnectRepository.deleteOneById({ connectScope, id: agent.id })
  }
}
