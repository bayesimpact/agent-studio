import {
  AgentSessionMessagesRoutes,
  type ListAgentSessionMessagesResponseDto,
} from "@caseai-connect/api-contracts"
import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "@/auth/jwt-auth.guard"
import { UserGuard } from "@/guards/user.guard"
import type { EndpointRequest } from "@/request.interface"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentSessionsService } from "./agent-sessions.service"

@UseGuards(JwtAuthGuard, UserGuard)
@Controller()
export class AgentMessagesController {
  constructor(private readonly agentSessionsService: AgentSessionsService) {}

  @Get(AgentSessionMessagesRoutes.listMessages.path)
  async listMessages(
    @Req() request: EndpointRequest,
    @Param("sessionId") sessionId: string,
  ): Promise<typeof AgentSessionMessagesRoutes.listMessages.response> {
    const user = request.user

    const messages = await this.agentSessionsService.listMessagesForSession(sessionId, user.id)

    const data: ListAgentSessionMessagesResponseDto = {
      sessionId,
      messages,
    }

    return {
      data,
    }
  }
}
