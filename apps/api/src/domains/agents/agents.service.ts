import { Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
// biome-ignore lint/style/useImportType: DataSource required at runtime for NestJS DI
import { DataSource, type Repository } from "typeorm"
import { ConnectRepository } from "@/common/entities/connect-repository"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DocumentTagsService } from "../documents/tags/document-tags.service"
import type { DocumentTagsUpdateFields } from "../documents/tags/document-tags.types"
import { Agent } from "./agent.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { BaseAgentSessionsService } from "./base-agent-sessions/base-agent-sessions.service"
import { AgentMembership } from "./memberships/agent-membership.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentMembershipsService } from "./memberships/agent-memberships.service"

@Injectable()
export class AgentsService {
  private readonly agentConnectRepository: ConnectRepository<Agent>

  constructor(
    @InjectRepository(Agent)
    agentRepository: Repository<Agent>,
    private readonly documentTagsService: DocumentTagsService,
    private readonly agentMembershipsService: AgentMembershipsService,
    private readonly baseAgentSessionsService: BaseAgentSessionsService,
    private readonly dataSource: DataSource,
  ) {
    this.agentConnectRepository = new ConnectRepository(agentRepository, "agents")
  }

  /**
   * Creates a new agent for a project.
   */
  async createAgent({
    userId,
    connectScope,
    fields,
  }: {
    userId: string
    connectScope: RequiredConnectScope
    fields: Pick<RequiredConnectScope, never> &
      Pick<Agent, "defaultPrompt" | "name" | "model" | "temperature" | "locale" | "type"> &
      Partial<Pick<Agent, "outputJsonSchema">> &
      DocumentTagsUpdateFields
  }): Promise<Agent> {
    // Validate name (min 3 characters)
    if (fields.name.length < 3) {
      throw new UnprocessableEntityException("Agent name must be at least 3 characters long")
    }

    const outputJsonSchema = fields.outputJsonSchema || null
    if (fields.type === "extraction" && !outputJsonSchema) {
      throw new UnprocessableEntityException("Extraction agent requires outputJsonSchema")
    }

    const { tagsToAdd, ...agentFields } = fields
    const documentTags = await this.documentTagsService.resolveTagChanges({
      currentTags: [],
      tagsToAdd,
    })

    // Create the agent with defaults
    const agent = await this.agentConnectRepository.createAndSave(connectScope, {
      ...agentFields,
      type: agentFields.type,
      outputJsonSchema,
      documentTags,
    })

    await this.agentMembershipsService.createAgentOwnerMembership({
      agentId: agent.id,
      userId,
    })
    return agent
  }

  /**
   * Lists all agents for a project.
   */
  async listAgents(connectScope: RequiredConnectScope): Promise<Agent[]> {
    return (
      await this.agentConnectRepository.find(connectScope, {
        relations: ["documentTags"],
      })
    )?.sort((a, b) => a.name.localeCompare(b.name))
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
    agentId,
    fieldsToUpdate,
  }: {
    connectScope: RequiredConnectScope
    agentId: string
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
      > &
      DocumentTagsUpdateFields
  }): Promise<Agent> {
    const { name, defaultPrompt, model, temperature, locale, type } = fieldsToUpdate

    // Validate name if provided (min 3 characters)
    if (name !== undefined && name.length < 3) {
      throw new UnprocessableEntityException("Agent name must be at least 3 characters long")
    }

    // Find the agent
    const needsTags =
      (fieldsToUpdate.tagsToAdd !== undefined && fieldsToUpdate.tagsToAdd.length > 0) ||
      (fieldsToUpdate.tagsToRemove !== undefined && fieldsToUpdate.tagsToRemove.length > 0)
    const agent = await this.agentConnectRepository.getOneById(
      connectScope,
      agentId,
      needsTags ? { relations: ["documentTags"] } : undefined,
    )

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

    // Update the agent

    if (needsTags) {
      agent.documentTags = await this.documentTagsService.resolveTagChanges({
        currentTags: agent.documentTags ?? [],
        tagsToAdd: fieldsToUpdate.tagsToAdd,
        tagsToRemove: fieldsToUpdate.tagsToRemove,
      })
    }

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

    return updatedAgent
  }

  async deleteAgent({
    connectScope,
    agentId,
  }: {
    connectScope: RequiredConnectScope
    agentId: string
  }): Promise<void> {
    const agent = await this.agentConnectRepository.getOneById(connectScope, agentId)

    if (!agent) {
      throw new NotFoundException(`Agent with id ${agentId} not found`)
    }

    await this.dataSource.transaction(async (entityManager) => {
      await this.baseAgentSessionsService.deleteAgentSessions(entityManager, agentId, agent.type)

      // Delete memberships
      await entityManager.delete(AgentMembership, { agentId })

      // Delete agent
      await entityManager.delete(Agent, { id: agentId })
    })
  }
}
