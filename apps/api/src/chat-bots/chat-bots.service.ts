import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import type { ChatSessionsService } from "@/chat-sessions/chat-sessions.service"
import type { MembershipRole } from "@/organizations/user-membership.entity"
import { UserMembership } from "@/organizations/user-membership.entity"
import { Project } from "@/projects/project.entity"
import { ChatBot } from "./chat-bot.entity"

@Injectable()
export class ChatBotsService {
  constructor(
    @InjectRepository(ChatBot)
    private readonly chatBotRepository: Repository<ChatBot>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(UserMembership)
    private readonly membershipRepository: Repository<UserMembership>,
    private readonly chatSessionsService: ChatSessionsService,
  ) {}

  /**
   * Verifies that a user can create chat bots for a project.
   * User must be either "owner" or "admin" of the project's organization.
   * Throws ForbiddenException if the user is not a member or doesn't have the required role.
   */
  async verifyUserCanCreateChatBot(userId: string, projectId: string): Promise<void> {
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
        `User must be an owner or admin of organization ${project.organizationId} to create chat bots`,
      )
    }
  }

  /**
   * Verifies that a user can update a chat bot.
   * User must be either "owner" or "admin" of the chat bot's project's organization.
   * Throws ForbiddenException if the user is not a member or doesn't have the required role.
   */
  async verifyUserCanUpdateChatBot(userId: string, chatBotId: string): Promise<void> {
    const chatBot = await this.chatBotRepository.findOne({
      where: { id: chatBotId },
      relations: ["project"],
    })

    if (!chatBot) {
      throw new NotFoundException(`ChatBot with id ${chatBotId} not found`)
    }

    const membership = await this.membershipRepository.findOne({
      where: {
        userId,
        organizationId: chatBot.project.organizationId,
      },
    })

    if (!membership) {
      throw new ForbiddenException(
        `User does not have access to organization ${chatBot.project.organizationId}`,
      )
    }

    const allowedRoles: MembershipRole[] = ["owner", "admin"]
    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException(
        `User must be an owner or admin of organization ${chatBot.project.organizationId} to update chat bots`,
      )
    }
  }

  /**
   * Verifies that a user can delete a chat bot.
   * User must be either "owner" or "admin" of the chat bot's project's organization.
   * Throws ForbiddenException if the user is not a member or doesn't have the required role.
   */
  async verifyUserCanDeleteChatBot(userId: string, chatBotId: string): Promise<void> {
    const chatBot = await this.chatBotRepository.findOne({
      where: { id: chatBotId },
      relations: ["project"],
    })

    if (!chatBot) {
      throw new NotFoundException(`ChatBot with id ${chatBotId} not found`)
    }

    const membership = await this.membershipRepository.findOne({
      where: {
        userId,
        organizationId: chatBot.project.organizationId,
      },
    })

    if (!membership) {
      throw new ForbiddenException(
        `User does not have access to organization ${chatBot.project.organizationId}`,
      )
    }

    const allowedRoles: MembershipRole[] = ["owner", "admin"]
    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException(
        `User must be an owner or admin of organization ${chatBot.project.organizationId} to delete chat bots`,
      )
    }
  }

  /**
   * Verifies that a user can list chat bots for a project.
   * User must be a member of the project's organization.
   * Throws ForbiddenException if the user is not a member.
   */
  async verifyUserCanListChatBots(userId: string, projectId: string): Promise<void> {
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
   * Creates a new chat bot for a project.
   * Verifies that the user is an owner or admin of the project's organization before creating.
   */
  async createChatBot(
    userId: string,
    projectId: string,
    name: string,
    defaultPrompt: string,
    model?: string,
    temperature?: number,
    locale?: string,
  ): Promise<ChatBot> {
    // Validate name (min 3 characters)
    if (name.length < 3) {
      throw new ForbiddenException("ChatBot name must be at least 3 characters long")
    }

    // Verify user is owner or admin of the project's organization
    await this.verifyUserCanCreateChatBot(userId, projectId)

    // Verify project exists
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`)
    }

    // Create the chat bot with defaults
    const chatBot = this.chatBotRepository.create({
      name,
      defaultPrompt,
      model: model || "gemini-2.5-flash",
      temperature: temperature ?? 0,
      locale: locale || "en",
      projectId,
      project,
    })

    return this.chatBotRepository.save(chatBot)
  }

  /**
   * Lists all chat bots for a project.
   * Verifies that the user has access to the project's organization before listing.
   */
  async listChatBots(userId: string, projectId: string): Promise<ChatBot[]> {
    // Verify user has access to the project's organization
    await this.verifyUserCanListChatBots(userId, projectId)

    // List chat bots for the project
    return this.chatBotRepository.find({
      where: { projectId },
      order: { createdAt: "DESC" },
    })
  }

  /**
   * Updates a chat bot.
   * Verifies that the user is an owner or admin of the chat bot's project's organization before updating.
   * Deletes playground sessions if configuration fields change.
   */
  async updateChatBot(
    userId: string,
    chatBotId: string,
    name?: string,
    defaultPrompt?: string,
    model?: string,
    temperature?: number,
    locale?: string,
  ): Promise<ChatBot> {
    // Validate name if provided (min 3 characters)
    if (name !== undefined && name.length < 3) {
      throw new ForbiddenException("ChatBot name must be at least 3 characters long")
    }

    // Verify user can update the chat bot
    await this.verifyUserCanUpdateChatBot(userId, chatBotId)

    // Find the chat bot
    const chatBot = await this.chatBotRepository.findOne({
      where: { id: chatBotId },
    })

    if (!chatBot) {
      throw new NotFoundException(`ChatBot with id ${chatBotId} not found`)
    }

    // Track if configuration fields changed (these trigger playground cleanup)
    const configChanged =
      (model !== undefined && model !== chatBot.model) ||
      (temperature !== undefined && temperature !== chatBot.temperature) ||
      (defaultPrompt !== undefined && defaultPrompt !== chatBot.defaultPrompt) ||
      (locale !== undefined && locale !== chatBot.locale)

    // Update the chat bot
    if (name !== undefined) {
      chatBot.name = name
    }
    if (defaultPrompt !== undefined) {
      chatBot.defaultPrompt = defaultPrompt
    }
    if (model !== undefined) {
      chatBot.model = model
    }
    if (temperature !== undefined) {
      chatBot.temperature = temperature
    }
    if (locale !== undefined) {
      chatBot.locale = locale
    }

    const updatedChatBot = await this.chatBotRepository.save(chatBot)

    // If configuration changed, delete all playground sessions for this chatbot
    if (configChanged) {
      await this.chatSessionsService.deletePlaygroundSessionsForChatBot(chatBotId)
    }

    return updatedChatBot
  }

  /**
   * Deletes a chat bot.
   * Verifies that the user is an owner or admin of the chat bot's project's organization before deleting.
   */
  async deleteChatBot(userId: string, chatBotId: string): Promise<void> {
    // Verify user can delete the chat bot
    await this.verifyUserCanDeleteChatBot(userId, chatBotId)

    // Find the chat bot
    const chatBot = await this.chatBotRepository.findOne({
      where: { id: chatBotId },
    })

    if (!chatBot) {
      throw new NotFoundException(`ChatBot with id ${chatBotId} not found`)
    }

    // Delete the chat bot
    await this.chatBotRepository.remove(chatBot)
  }
}
