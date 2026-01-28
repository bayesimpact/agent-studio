import type { TimeType } from "@caseai-connect/api-contracts"
import { Controller, Param, Post, Req, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "@/auth/jwt-auth.guard"
import { UserGuard } from "@/guards/user.guard"
import type { EndpointRequest } from "@/request.interface"
import { ChatSessionsRoutes } from "./chat-sessions.routes"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ChatSessionsService } from "./chat-sessions.service"

@UseGuards(JwtAuthGuard, UserGuard)
@Controller()
export class ChatSessionsController {
  constructor(private readonly chatSessionsService: ChatSessionsService) {}

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

    const response = {
      id: session.id,
      chatbotId: session.chatbotId,
      type: session.type,
      expiresAt: session.expiresAt ? (session.expiresAt.getTime() as TimeType) : null,
    }

    return {
      data: response,
    }
  }
}
