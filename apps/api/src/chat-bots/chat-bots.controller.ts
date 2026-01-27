import type { TimeType } from "@caseai-connect/api-contracts"
import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "@/auth/jwt-auth.guard"
import { UserGuard } from "@/guards/user.guard"
import type { EndpointRequest } from "@/request.interface"
import { ChatBotsRoutes } from "./chat-bots.routes"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ChatBotsService } from "./chat-bots.service"

@UseGuards(JwtAuthGuard, UserGuard)
@Controller()
export class ChatBotsController {
  constructor(private readonly chatBotsService: ChatBotsService) {}

  @Post(ChatBotsRoutes.createChatBot.path)
  async createChatBot(
    @Req() request: EndpointRequest,
    @Body() body: typeof ChatBotsRoutes.createChatBot.request,
  ): Promise<typeof ChatBotsRoutes.createChatBot.response> {
    const user = request.user

    // Create ChatBot
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
    @Req() request: EndpointRequest,
    @Param("projectId") projectId: string,
  ): Promise<typeof ChatBotsRoutes.listChatBots.response> {
    const user = request.user

    // List ChatBots for the project
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
    @Req() request: EndpointRequest,
    @Param("chatBotId") chatBotId: string,
    @Body() body: typeof ChatBotsRoutes.updateChatBot.request,
  ): Promise<typeof ChatBotsRoutes.updateChatBot.response> {
    const user = request.user

    // Update ChatBot
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
    @Req() request: EndpointRequest,
    @Param("chatBotId") chatBotId: string,
  ): Promise<typeof ChatBotsRoutes.deleteChatBot.response> {
    // Delete ChatBot
    await this.chatBotsService.deleteChatBot(request.user.id, chatBotId)
    return { data: { success: true } }
  }
}
