import { Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentSessionsService } from "@/domains/agent-sessions/agent-sessions.service"
import { Agent } from "./agent.entity"

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    private readonly agentSessionsService: AgentSessionsService,
  ) {}

  /**
   * Creates a new agent for a project.
   */
  async createAgent(
    fields: Pick<
      Agent,
      "projectId" | "defaultPrompt" | "name" | "model" | "temperature" | "locale"
    >,
  ): Promise<Agent> {
    const { name } = fields

    // Validate name (min 3 characters)
    if (name.length < 3) {
      throw new UnprocessableEntityException("Agent name must be at least 3 characters long")
    }

    // Create the agent with defaults
    const agent = this.agentRepository.create(fields)

    return this.agentRepository.save(agent)
  }

  /**
   * Lists all agents for a project.
   */
  async listAgents({ projectId }: { projectId: string }): Promise<Agent[]> {
    // List agents for the project
    return this.agentRepository.find({
      where: { projectId },
      order: { createdAt: "DESC" },
    })
  }

  /**
   * Finds an agent by its id.
   * @param agentId The id of the agent to find.
   * @returns The agent if found, undefined otherwise.
   */
  async findAgentById(agentId: string): Promise<Agent | null> {
    return this.agentRepository.findOne({
      where: { id: agentId },
    })
  }

  /**
   * Updates a agent.
   * Verifies that the user is an owner or admin of the agent's project's organization before updating.
   * Deletes playground sessions if configuration fields change.
   */
  async updateAgent(params: {
    required: {
      agentId: string
    }
    fieldsToUpdate: Partial<
      Pick<Agent, "name" | "defaultPrompt" | "model" | "temperature" | "locale">
    >
  }): Promise<Agent> {
    const { agentId } = params.required
    const { name, defaultPrompt, model, temperature, locale } = params.fieldsToUpdate

    // Validate name if provided (min 3 characters)
    if (name !== undefined && name.length < 3) {
      throw new UnprocessableEntityException("Agent name must be at least 3 characters long")
    }

    // Find the agent
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
    })

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

    const updatedAgent = await this.agentRepository.save(agent)

    // If configuration changed, delete all playground sessions for this agent
    if (configChanged) {
      await this.agentSessionsService.deletePlaygroundSessionsForAgent(agentId)
    }

    return updatedAgent
  }

  /**
   * Deletes a agent.
   */
  async deleteAgent(agentId: string): Promise<void> {
    // Find the agent
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
    })

    if (!agent) {
      throw new NotFoundException(`Agent with id ${agentId} not found`)
    }

    // Delete all sessions for the agent
    await this.agentSessionsService.deleteAllSessionsForAgent(agentId)

    // Delete the agent
    await this.agentRepository.remove(agent)
  }
}
