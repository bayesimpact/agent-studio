import { Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ConnectRepository } from "@/common/entities/connect-repository"
import type { ConnectRequiredFields } from "@/common/entities/connect-required-fields"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentSessionsService } from "@/domains/agent-sessions/agent-sessions.service"
import { Agent } from "./agent.entity"

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    agentRepository: Repository<Agent>,
    private readonly agentSessionsService: AgentSessionsService,
  ) {
    this.agentConnectRepository = new ConnectRepository(agentRepository, "agents")
  }
  private readonly agentConnectRepository: ConnectRepository<Agent>

  /**
   * Creates a new agent for a project.
   */
  async createAgent({
    connectRequiredFields,
    fields,
  }: {
    connectRequiredFields: ConnectRequiredFields
    fields: Pick<ConnectRequiredFields, never> &
      Pick<Agent, "defaultPrompt" | "name" | "model" | "temperature" | "locale">
  }): Promise<Agent> {
    const { name } = fields

    // Validate name (min 3 characters)
    if (name.length < 3) {
      throw new UnprocessableEntityException("Agent name must be at least 3 characters long")
    }

    // Create the agent with defaults
    return await this.agentConnectRepository.createAndSave(connectRequiredFields, fields)
  }

  /**
   * Lists all agents for a project.
   */

  async listAgents(connectRequiredFields: ConnectRequiredFields): Promise<Agent[]> {
    return (await this.agentConnectRepository.getMany(connectRequiredFields))?.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )
  }

  /**
   * Finds an agent by its id.
   */
  async findAgentById({
    connectRequiredFields,
    agentId,
  }: {
    connectRequiredFields: ConnectRequiredFields
    agentId: string
  }): Promise<Agent | null> {
    return this.agentConnectRepository.getOneById(connectRequiredFields, agentId)
  }

  /**
   * Updates an agent.
   * Verifies that the user is an owner or admin of the agent's project's organization before updating.
   * Deletes playground sessions if configuration fields change.
   */
  async updateAgent({
    connectRequiredFields,
    required,
    fieldsToUpdate,
  }: {
    connectRequiredFields: ConnectRequiredFields
    required: {
      agentId: string
    }
    fieldsToUpdate: Pick<ConnectRequiredFields, never> &
      Partial<Pick<Agent, "name" | "defaultPrompt" | "model" | "temperature" | "locale">>
  }): Promise<Agent> {
    const { agentId } = required
    const { name, defaultPrompt, model, temperature, locale } = fieldsToUpdate

    // Validate name if provided (min 3 characters)
    if (name !== undefined && name.length < 3) {
      throw new UnprocessableEntityException("Agent name must be at least 3 characters long")
    }

    // Find the agent
    const agent = await this.agentConnectRepository.getOneById(connectRequiredFields, agentId)

    if (!agent) {
      throw new NotFoundException(`Agent with id ${agentId} not found`)
    }

    // Track if configuration fields changed (these trigger playground cleanup)
    const configFields = [
      { value: model, current: agent.model },
      { value: temperature, current: agent.temperature },
      { value: defaultPrompt, current: agent.defaultPrompt },
      { value: locale, current: agent.locale },
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
    })

    const updatedAgent = await this.agentConnectRepository.saveOne(agent)

    // If configuration changed, delete all playground sessions for this agent
    if (configChanged) {
      await this.agentSessionsService.deletePlaygroundSessionsForAgent(agentId)
    }

    return updatedAgent
  }

  /**
   * Deletes an agent.
   */
  async deleteAgent({
    connectRequiredFields,
    agentId,
  }: {
    connectRequiredFields: ConnectRequiredFields
    agentId: string
  }): Promise<void> {
    // Find the agent
    const agent = await this.agentConnectRepository.getOneById(connectRequiredFields, agentId)

    if (!agent) {
      throw new NotFoundException(`Agent with id ${agentId} not found`)
    }

    // Delete all sessions for the agent
    await this.agentSessionsService.deleteAllSessionsForAgent(agentId)

    // Delete the agent
    await this.agentConnectRepository.deleteOneById({ connectRequiredFields, id: agent.id })
  }
}
