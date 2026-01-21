import type {
  CreateChatBotRequestDto,
  TimeType,
  UpdateChatBotRequestDto,
} from "@caseai-connect/api-contracts"
import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "@/auth/jwt-auth.guard"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { UserBootstrapService } from "@/organizations/user-bootstrap.service"
import type { User } from "@/users/user.entity"
import { ChatBotsRoutes } from "./chat-bots.routes"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ChatBotsService } from "./chat-bots.service"

interface Auth0JwtPayload {
  sub: string
  email?: string
  name?: string
  picture?: string
}

@UseGuards(JwtAuthGuard)
@Controller()
export class ChatBotsController {
  constructor(
    private readonly userBootstrapService: UserBootstrapService,
    private readonly chatBotsService: ChatBotsService,
  ) {}

  @Post(ChatBotsRoutes.createChatBot.path)
  async createChatBot(
    @Req() request: { user: Auth0JwtPayload },
    @Body() body: { payload: CreateChatBotRequestDto },
  ): Promise<typeof ChatBotsRoutes.createChatBot.response> {
    const user = await this.ensureUserFromRequest(request)

    // Create chat template
    const chatBot = await this.chatBotsService.createChatBot(
      user.id,
      body.payload.projectId,
      body.payload.name,
      body.payload.defaultPrompt,
    )

    return {
      data: {
        id: chatBot.id,
        name: chatBot.name,
        defaultPrompt: chatBot.defaultPrompt,
        projectId: chatBot.projectId,
      },
    }
  }

  @Get(ChatBotsRoutes.listChatBots.path)
  async listChatBots(
    @Req() request: { user: Auth0JwtPayload },
    @Param("projectId") projectId: string,
  ): Promise<typeof ChatBotsRoutes.listChatBots.response> {
    const user = await this.ensureUserFromRequest(request)

    // List chat templates for the project
    const chatBots = await this.chatBotsService.listChatBots(user.id, projectId)

    return {
      data: {
        chatBots: chatBots.map((chatBot) => ({
          id: chatBot.id,
          name: chatBot.name,
          defaultPrompt: chatBot.defaultPrompt,
          projectId: chatBot.projectId,
          createdAt: chatBot.createdAt.getTime() as TimeType,
          updatedAt: chatBot.updatedAt.getTime() as TimeType,
        })),
      },
    }
  }

  @Patch(ChatBotsRoutes.updateChatBot.path)
  async updateChatBot(
    @Req() request: { user: Auth0JwtPayload },
    @Param("chatBotId") chatBotId: string,
    @Body() body: { payload: UpdateChatBotRequestDto },
  ): Promise<typeof ChatBotsRoutes.updateChatBot.response> {
    const user = await this.ensureUserFromRequest(request)

    // Update chat template
    const chatBot = await this.chatBotsService.updateChatBot(
      user.id,
      chatBotId,
      body.payload.name,
      body.payload.defaultPrompt,
    )

    return {
      data: {
        id: chatBot.id,
        name: chatBot.name,
        defaultPrompt: chatBot.defaultPrompt,
        projectId: chatBot.projectId,
      },
    }
  }

  @Delete(ChatBotsRoutes.deleteChatBot.path)
  async deleteChatBot(
    @Req() request: { user: Auth0JwtPayload },
    @Param("chatBotId") chatBotId: string,
  ): Promise<typeof ChatBotsRoutes.deleteChatBot.response> {
    const user = await this.ensureUserFromRequest(request)

    // Delete chat template
    await this.chatBotsService.deleteChatBot(user.id, chatBotId)

    return {
      data: {
        success: true,
      },
    }
  }

  /**
   * Extracts Auth0 user info from JWT payload and ensures the user exists locally.
   * Returns the local User entity.
   */
  private async ensureUserFromRequest(request: { user: Auth0JwtPayload }): Promise<User> {
    const auth0UserInfo = {
      sub: request.user.sub,
      email: request.user.email,
      name: request.user.name,
      picture: request.user.picture,
    }

    return this.userBootstrapService.ensureUser(auth0UserInfo)
  }
}
