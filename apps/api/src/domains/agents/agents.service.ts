import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentSessionsService } from "@/domains/agent-sessions/agent-sessions.service"
import type { MembershipRole } from "@/domains/organizations/user-membership.entity"
import { UserMembership } from "@/domains/organizations/user-membership.entity"
import { Project } from "@/domains/projects/project.entity"
import { Agent } from "./agent.entity"

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(UserMembership)
    private readonly membershipRepository: Repository<UserMembership>,
    private readonly agentSessionsService: AgentSessionsService,
  ) {}

  /**
   * Verifies that a user can create agents for a project.
   * User must be either "owner" or "admin" of the project's organization.
   * Throws ForbiddenException if the user is not a member or doesn't have the required role.
   */
  async verifyUserCanCreateAgent(userId: string, projectId: string): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`)
    }

    const membership = await this.membershipRepository.findOne({
      where: {
        userId,
        organizationId: project.organizationId,
      },
    })

    if (!membership) {
      throw new ForbiddenException(
        `User does not have access to organization ${project.organizationId}`,
      )
    }

    const allowedRoles: MembershipRole[] = ["owner", "admin"]
    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException(
        `User must be an owner or admin of organization ${project.organizationId} to create agents`,
      )
    }
  }

  /**
   * Verifies that a user can update a agent.
   * User must be either "owner" or "admin" of the agent's project's organization.
   * Throws ForbiddenException if the user is not a member or doesn't have the required role.
   */
  async verifyUserCanUpdateAgent(userId: string, agentId: string): Promise<void> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
      relations: ["project"],
    })

    if (!agent) {
      throw new NotFoundException(`Agent with id ${agentId} not found`)
    }

    const membership = await this.membershipRepository.findOne({
      where: {
        userId,
        organizationId: agent.project.organizationId,
      },
    })

    if (!membership) {
      throw new ForbiddenException(
        `User does not have access to organization ${agent.project.organizationId}`,
      )
    }

    const allowedRoles: MembershipRole[] = ["owner", "admin"]
    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException(
        `User must be an owner or admin of organization ${agent.project.organizationId} to update agents`,
      )
    }
  }

  /**
   * Verifies that a user can delete a agent.
   * User must be either "owner" or "admin" of the agent's project's organization.
   * Throws ForbiddenException if the user is not a member or doesn't have the required role.
   */
  async verifyUserCanDeleteAgent(userId: string, agentId: string): Promise<void> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
      relations: ["project"],
    })

    if (!agent) {
      throw new NotFoundException(`Agent with id ${agentId} not found`)
    }

    const membership = await this.membershipRepository.findOne({
      where: {
        userId,
        organizationId: agent.project.organizationId,
      },
    })

    if (!membership) {
      throw new ForbiddenException(
        `User does not have access to organization ${agent.project.organizationId}`,
      )
    }

    const allowedRoles: MembershipRole[] = ["owner", "admin"]
    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException(
        `User must be an owner or admin of organization ${agent.project.organizationId} to delete agents`,
      )
    }
  }

  /**
   * Verifies that a user can list agents for a project.
   * User must be a member of the project's organization.
   * Throws ForbiddenException if the user is not a member.
   */
  async verifyUserCanListAgents(userId: string, projectId: string): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`)
    }

    const membership = await this.membershipRepository.findOne({
      where: {
        userId,
        organizationId: project.organizationId,
      },
    })

    if (!membership) {
      throw new ForbiddenException(
        `User does not have access to organization ${project.organizationId}`,
      )
    }
  }

  /**
   * Creates a new agent for a project.
   * Verifies that the user is an owner or admin of the project's organization before creating.
   */
  async createAgent(
    params: {
      userId: string
    } & Pick<Agent, "projectId" | "defaultPrompt" | "name" | "model" | "temperature" | "locale">,
  ): Promise<Agent> {
    const { userId, ...fields } = params
    const { projectId, name } = fields

    // Validate name (min 3 characters)
    if (name.length < 3) {
      throw new ForbiddenException("Agent name must be at least 3 characters long")
    }

    // Verify user is owner or admin of the project's organization
    await this.verifyUserCanCreateAgent(userId, projectId)

    // Verify project exists
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`)
    }

    // Create the agent with defaults
    const agent = this.agentRepository.create(fields)

    return this.agentRepository.save(agent)
  }

  /**
   * Lists all agents for a project.
   * Verifies that the user has access to the project's organization before listing.
   */
  async listAgents({ userId, projectId }: { userId: string; projectId: string }): Promise<Agent[]> {
    // Verify user has access to the project's organization
    await this.verifyUserCanListAgents(userId, projectId)

    // List agents for the project
    return this.agentRepository.find({
      where: { projectId },
      order: { createdAt: "DESC" },
    })
  }

  /**
   * Updates a agent.
   * Verifies that the user is an owner or admin of the agent's project's organization before updating.
   * Deletes playground sessions if configuration fields change.
   */
  async updateAgent(params: {
    required: {
      userId: string
      agentId: string
    }
    fieldsToUpdate: Partial<
      Pick<Agent, "name" | "defaultPrompt" | "model" | "temperature" | "locale">
    >
  }): Promise<Agent> {
    const { userId, agentId } = params.required
    const { name, defaultPrompt, model, temperature, locale } = params.fieldsToUpdate

    // Validate name if provided (min 3 characters)
    if (name !== undefined && name.length < 3) {
      throw new ForbiddenException("Agent name must be at least 3 characters long")
    }

    // Verify user can update the agent
    await this.verifyUserCanUpdateAgent(userId, agentId)

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
   * Verifies that the user is an owner or admin of the agent's project's organization before deleting.
   */
  async deleteAgent(userId: string, agentId: string): Promise<void> {
    // Verify user can delete the agent
    await this.verifyUserCanDeleteAgent(userId, agentId)

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
