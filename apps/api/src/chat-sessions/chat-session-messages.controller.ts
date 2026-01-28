import {
  ChatSessionMessagesRoutes,
  type ListChatSessionMessagesResponseDto,
} from "@caseai-connect/api-contracts"
import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "@/auth/jwt-auth.guard"
import { UserGuard } from "@/guards/user.guard"
import type { EndpointRequest } from "@/request.interface"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ChatSessionsService } from "./chat-sessions.service"

@UseGuards(JwtAuthGuard, UserGuard)
@Controller()
export class ChatSessionMessagesController {
  constructor(private readonly chatSessionsService: ChatSessionsService) {}

  @Get(ChatSessionMessagesRoutes.listMessages.path)
  async listMessages(
    @Req() request: EndpointRequest,
    @Param("sessionId") sessionId: string,
  ): Promise<typeof ChatSessionMessagesRoutes.listMessages.response> {
    const user = request.user

    const messages = await this.chatSessionsService.listMessagesForSession(sessionId, user.id)

    const data: ListChatSessionMessagesResponseDto = {
      sessionId,
      messages,
    }

    return {
      data,
    }
  }
}
