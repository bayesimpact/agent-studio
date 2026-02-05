import type { MessageEvent } from "@nestjs/common"
import {
  Controller,
  ForbiddenException,
  NotFoundException,
  Query,
  Req,
  Sse,
  UseGuards,
} from "@nestjs/common"
import { Observable } from "rxjs"
import { JwtAuthGuard } from "@/auth/jwt-auth.guard"
import { UserGuard } from "@/guards/user.guard"
import type { EndpointRequest } from "@/request.interface"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentSessionsService } from "./agent-sessions.service"
import { ChatSessionStreamingRoutes } from "./chat-session-streaming.routes"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ChatStreamingService } from "./chat-streaming.service"

@UseGuards(JwtAuthGuard, UserGuard)
@Controller()
export class ChatSessionStreamingController {
  constructor(
    private readonly chatSessionsService: AgentSessionsService,
    private readonly chatStreamingService: ChatStreamingService,
  ) {}

  @Sse(ChatSessionStreamingRoutes.streamPlayground.path)
  streamPlayground(
    @Req() request: EndpointRequest,
    @Query("q") userContent: string,
  ): Observable<MessageEvent> {
    if (!userContent || !userContent.trim()) {
      throw new ForbiddenException("User content must not be empty")
    }

    const user = request.user

    const sessionId = (request as unknown as { params?: { sessionId?: string } }).params?.sessionId
    if (!sessionId) {
      throw new NotFoundException("sessionId is required")
    }

    return new Observable<MessageEvent>((subscriber) => {
      void (async () => {
        try {
          const { session, agent } = await this.chatSessionsService.getSessionWithAgentForUser(
            sessionId,
            user.id,
          )

          for await (const event of this.chatStreamingService.streamChatResponse(
            session,
            agent,
            userContent,
          )) {
            subscriber.next(event)
          }

          subscriber.complete()
        } catch (error) {
          subscriber.error(error)
        }
      })()
    })
  }
}
