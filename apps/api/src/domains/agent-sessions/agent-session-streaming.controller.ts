import { AgentSessionStreamingRoutes } from "@caseai-connect/api-contracts"
import type { MessageEvent } from "@nestjs/common"
import { Controller, ForbiddenException, Param, Query, Req, Sse, UseGuards } from "@nestjs/common"
import { Observable } from "rxjs"
import type { EndpointRequestWithAgent } from "@/common/context/request.interface"
import { AddContext, RequireContext } from "@/common/context/require-context.decorator"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { UserGuard } from "@/domains/users/user.guard"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentStreamingService } from "./agent-streaming.service"

@UseGuards(JwtAuthGuard, UserGuard, ResourceContextGuard)
@RequireContext("organization", "project")
@Controller()
export class AgentSessionStreamingController {
  constructor(private readonly chatStreamingService: AgentStreamingService) {}

  @AddContext("agent")
  @CheckPolicy((policy) => policy.canList())
  @Sse(AgentSessionStreamingRoutes.stream.path, { method: 0 /* GET */ })
  stream(
    @Req() request: EndpointRequestWithAgent,
    @Query("q") query: string,
    // FIXME: use a AgentSessionGuard
    @Param("sessionId") sessionId: string,
  ): Observable<MessageEvent> {
    try {
      const parsedQuery = JSON.parse(query) as typeof AgentSessionStreamingRoutes.stream.request
      const userContent = parsedQuery.payload.content
      const documentId = parsedQuery.payload.documentId
      const organizationId = request.organizationId
      const projectId = request.project.id
      const agent = request.agent

      if (!userContent) {
        throw new ForbiddenException("Missing user content")
      }

      if (typeof userContent === "string" && !userContent.trim()) {
        throw new ForbiddenException("User content must not be empty")
      }

      return new Observable<MessageEvent>((subscriber) => {
        void (async () => {
          try {
            const events = this.chatStreamingService.streamAgentResponse({
              connectScope: { organizationId, projectId },
              agent,
              sessionId,
              userContent,
              documentId,
            })

            for await (const event of events) {
              subscriber.next(event)
            }

            subscriber.complete()
          } catch (error) {
            subscriber.error(error)
          }
        })()
      })
    } catch (_) {
      throw new ForbiddenException("Invalid query format")
    }
  }
}
