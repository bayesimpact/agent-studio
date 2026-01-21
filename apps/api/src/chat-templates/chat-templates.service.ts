import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { type MembershipRole, UserMembership } from "@/organizations/user-membership.entity"
import { Project } from "@/projects/project.entity"
import { ChatTemplate } from "./chat-template.entity"

@Injectable()
export class ChatTemplatesService {
  constructor(
    @InjectRepository(ChatTemplate)
    private readonly chatTemplateRepository: Repository<ChatTemplate>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(UserMembership)
    private readonly membershipRepository: Repository<UserMembership>,
  ) {}

  /**
   * Verifies that a user can create chat templates for a project.
   * User must be either "owner" or "admin" of the project's organization.
   * Throws ForbiddenException if the user is not a member or doesn't have the required role.
   */
  async verifyUserCanCreateChatTemplate(userId: string, projectId: string): Promise<void> {
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
        `User must be an owner or admin of organization ${project.organizationId} to create chat templates`,
      )
    }
  }

  /**
   * Verifies that a user can update a chat template.
   * User must be either "owner" or "admin" of the chat template's project's organization.
   * Throws ForbiddenException if the user is not a member or doesn't have the required role.
   */
  async verifyUserCanUpdateChatTemplate(userId: string, chatTemplateId: string): Promise<void> {
    const chatTemplate = await this.chatTemplateRepository.findOne({
      where: { id: chatTemplateId },
      relations: ["project"],
    })

    if (!chatTemplate) {
      throw new NotFoundException(`Chat template with id ${chatTemplateId} not found`)
    }

    const membership = await this.membershipRepository.findOne({
      where: {
        userId,
        organizationId: chatTemplate.project.organizationId,
      },
    })

    if (!membership) {
      throw new ForbiddenException(
        `User does not have access to organization ${chatTemplate.project.organizationId}`,
      )
    }

    const allowedRoles: MembershipRole[] = ["owner", "admin"]
    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException(
        `User must be an owner or admin of organization ${chatTemplate.project.organizationId} to update chat templates`,
      )
    }
  }

  /**
   * Verifies that a user can delete a chat template.
   * User must be either "owner" or "admin" of the chat template's project's organization.
   * Throws ForbiddenException if the user is not a member or doesn't have the required role.
   */
  async verifyUserCanDeleteChatTemplate(userId: string, chatTemplateId: string): Promise<void> {
    const chatTemplate = await this.chatTemplateRepository.findOne({
      where: { id: chatTemplateId },
      relations: ["project"],
    })

    if (!chatTemplate) {
      throw new NotFoundException(`Chat template with id ${chatTemplateId} not found`)
    }

    const membership = await this.membershipRepository.findOne({
      where: {
        userId,
        organizationId: chatTemplate.project.organizationId,
      },
    })

    if (!membership) {
      throw new ForbiddenException(
        `User does not have access to organization ${chatTemplate.project.organizationId}`,
      )
    }

    const allowedRoles: MembershipRole[] = ["owner", "admin"]
    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException(
        `User must be an owner or admin of organization ${chatTemplate.project.organizationId} to delete chat templates`,
      )
    }
  }

  /**
   * Verifies that a user can list chat templates for a project.
   * User must be a member of the project's organization.
   * Throws ForbiddenException if the user is not a member.
   */
  async verifyUserCanListChatTemplates(userId: string, projectId: string): Promise<void> {
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
   * Creates a new chat template for a project.
   * Verifies that the user is an owner or admin of the project's organization before creating.
   */
  async createChatTemplate(
    userId: string,
    projectId: string,
    name: string,
    defaultPrompt: string,
  ): Promise<ChatTemplate> {
    // Validate name (min 3 characters)
    if (name.length < 3) {
      throw new ForbiddenException("Chat template name must be at least 3 characters long")
    }

    // Verify user is owner or admin of the project's organization
    await this.verifyUserCanCreateChatTemplate(userId, projectId)

    // Verify project exists
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`)
    }

    // Create the chat template
    const chatTemplate = this.chatTemplateRepository.create({
      name,
      defaultPrompt,
      projectId,
      project,
    })

    return this.chatTemplateRepository.save(chatTemplate)
  }

  /**
   * Lists all chat templates for a project.
   * Verifies that the user has access to the project's organization before listing.
   */
  async listChatTemplates(userId: string, projectId: string): Promise<ChatTemplate[]> {
    // Verify user has access to the project's organization
    await this.verifyUserCanListChatTemplates(userId, projectId)

    // List chat templates for the project
    return this.chatTemplateRepository.find({
      where: { projectId },
      order: { createdAt: "DESC" },
    })
  }

  /**
   * Updates a chat template.
   * Verifies that the user is an owner or admin of the chat template's project's organization before updating.
   */
  async updateChatTemplate(
    userId: string,
    chatTemplateId: string,
    name?: string,
    defaultPrompt?: string,
  ): Promise<ChatTemplate> {
    // Validate name if provided (min 3 characters)
    if (name !== undefined && name.length < 3) {
      throw new ForbiddenException("Chat template name must be at least 3 characters long")
    }

    // Verify user can update the chat template
    await this.verifyUserCanUpdateChatTemplate(userId, chatTemplateId)

    // Find the chat template
    const chatTemplate = await this.chatTemplateRepository.findOne({
      where: { id: chatTemplateId },
    })

    if (!chatTemplate) {
      throw new NotFoundException(`Chat template with id ${chatTemplateId} not found`)
    }

    // Update the chat template
    if (name !== undefined) {
      chatTemplate.name = name
    }
    if (defaultPrompt !== undefined) {
      chatTemplate.defaultPrompt = defaultPrompt
    }

    return this.chatTemplateRepository.save(chatTemplate)
  }

  /**
   * Deletes a chat template.
   * Verifies that the user is an owner or admin of the chat template's project's organization before deleting.
   */
  async deleteChatTemplate(userId: string, chatTemplateId: string): Promise<void> {
    // Verify user can delete the chat template
    await this.verifyUserCanDeleteChatTemplate(userId, chatTemplateId)

    // Find the chat template
    const chatTemplate = await this.chatTemplateRepository.findOne({
      where: { id: chatTemplateId },
    })

    if (!chatTemplate) {
      throw new NotFoundException(`Chat template with id ${chatTemplateId} not found`)
    }

    // Delete the chat template
    await this.chatTemplateRepository.remove(chatTemplate)
  }
}
