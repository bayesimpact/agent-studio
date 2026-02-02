import type { ChatSessionDto } from "@caseai-connect/api-contracts"
import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "@/auth/jwt-auth.guard"
import { UserGuard } from "@/guards/user.guard"
import type { EndpointRequest } from "@/request.interface"
import type { ChatSession } from "./chat-session.entity"
import { ChatSessionsRoutes } from "./chat-sessions.routes"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ChatSessionsService } from "./chat-sessions.service"

@UseGuards(JwtAuthGuard, UserGuard)
@Controller()
export class ChatSessionsController {
  constructor(private readonly chatSessionsService: ChatSessionsService) {}

  // FIXME: add ability checks shoud be admin
  @Get(ChatSessionsRoutes.getAllPlayground.path)
  async getAllPlayground(
    @Req() request: EndpointRequest,
    @Param("chatBotId") chatBotId: string,
  ): Promise<typeof ChatSessionsRoutes.getAllPlayground.response> {
    const user = request.user

    const sessions = await this.chatSessionsService.getAllSessionsForChatBot({
      chatBotId: chatBotId,
      userId: user.id,
      type: "playground",
    })

    return { data: sessions.map(toChatSessionDto) }
  }

  @Get(ChatSessionsRoutes.getAllApp.path)
  async getAllApp(
    @Req() request: EndpointRequest,
    @Param("chatBotId") chatBotId: string,
  ): Promise<typeof ChatSessionsRoutes.getAllApp.response> {
    const user = request.user

    const sessions = await this.chatSessionsService.getAllSessionsForChatBot({
      chatBotId: chatBotId,
      userId: user.id,
      type: "app-private",
    })

    return { data: sessions.map(toChatSessionDto) }
  }

  @Post(ChatSessionsRoutes.createPlaygroundSession.path)
  async createPlaygroundSession(
    @Req() request: EndpointRequest,
    @Param("chatBotId") chatBotId: string,
  ): Promise<typeof ChatSessionsRoutes.createPlaygroundSession.response> {
    const user = request.user

    const session = await this.chatSessionsService.createPlaygroundSessionForChatBot(
      chatBotId,
      user.id,
    )

    return { data: toChatSessionDto(session) }
  }

  @Post(ChatSessionsRoutes.createAppSession.path)
  async createAppSession(
    @Req() request: EndpointRequest,
    @Param("chatBotId") chatBotId: string,
    @Body() { payload }: typeof ChatSessionsRoutes.createAppSession.request,
  ): Promise<typeof ChatSessionsRoutes.createAppSession.response> {
    const user = request.user

    if (payload.chatSessionType !== "app-private") {
      throw new Error("Session type not supported.")
    }

    const session = await this.chatSessionsService.createAppPrivateSession({
      chatBotId: chatBotId,
      userId: user.id,
    })

    return { data: toChatSessionDto(session) }
  }
}

function toChatSessionDto(entity: ChatSession): ChatSessionDto {
  return {
    id: entity.id,
    chatBotId: entity.chatBotId,
    type: entity.type,
    expiresAt: entity.expiresAt ? entity.expiresAt.getTime() : null,
  }
}
