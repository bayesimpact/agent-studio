import type { ChatBotDto } from "@caseai-connect/api-contracts"
import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "@/auth/jwt-auth.guard"
import { UserGuard } from "@/guards/user.guard"
import type { EndpointRequest } from "@/request.interface"
import type { ChatBot } from "./chat-bot.entity"
import { ChatBotsRoutes } from "./chat-bots.routes"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ChatBotsService } from "./chat-bots.service"

@UseGuards(JwtAuthGuard, UserGuard)
@Controller()
export class ChatBotsController {
  constructor(private readonly chatBotsService: ChatBotsService) {}

  @Post(ChatBotsRoutes.createOne.path)
  async createOne(
    @Req() request: EndpointRequest,
    @Param("projectId") projectId: string,
    @Body() { payload }: typeof ChatBotsRoutes.createOne.request,
  ): Promise<typeof ChatBotsRoutes.createOne.response> {
    const user = request.user

    const chatBot = await this.chatBotsService.createChatBot({
      userId: user.id,
      projectId,
      ...payload,
    })

    if (!chatBot) {
      throw new Error("ChatBot not created")
    }
    return { data: { success: true } }
  }

  @Get(ChatBotsRoutes.getAll.path)
  async getAll(
    @Req() request: EndpointRequest,
    @Param("projectId") projectId: string,
  ): Promise<typeof ChatBotsRoutes.getAll.response> {
    const user = request.user

    const chatBots = await this.chatBotsService.listChatBots({ userId: user.id, projectId })

    return { data: { chatBots: chatBots.map(toChatBotDto) } }
  }

  @Patch(ChatBotsRoutes.updateOne.path)
  async updateOne(
    @Req() request: EndpointRequest,
    @Param("chatBotId") chatBotId: string,
    @Body() { payload }: typeof ChatBotsRoutes.updateOne.request,
  ): Promise<typeof ChatBotsRoutes.updateOne.response> {
    const user = request.user

    const chatBot = await this.chatBotsService.updateChatBot({
      required: { userId: user.id, chatBotId },
      fieldsToUpdate: payload,
    })

    if (!chatBot) {
      throw new Error("ChatBot not updated")
    }
    return { data: { success: true } }
  }

  @Delete(ChatBotsRoutes.deleteOne.path)
  async deleteOne(
    @Req() request: EndpointRequest,
    @Param("chatBotId") chatBotId: string,
  ): Promise<typeof ChatBotsRoutes.deleteOne.response> {
    await this.chatBotsService.deleteChatBot(request.user.id, chatBotId)
    return { data: { success: true } }
  }
}

function toChatBotDto(entity: ChatBot): ChatBotDto {
  return {
    createdAt: entity.createdAt.getTime(),
    defaultPrompt: entity.defaultPrompt,
    id: entity.id,
    locale: entity.locale,
    model: entity.model,
    name: entity.name,
    projectId: entity.projectId,
    temperature: entity.temperature,
    updatedAt: entity.updatedAt.getTime(),
  }
}
