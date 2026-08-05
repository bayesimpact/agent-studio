import { AgentSessionMessagesRoutes, type StreamEvent } from "@caseai-connect/api-contracts"
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
import type { EndpointRequestWithAgentSession } from "@/common/context/request.interface"
import { getRequiredConnectScope } from "@/common/context/request-context.helpers"
import { RequireContext } from "@/common/context/require-context.decorator"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import type { ConversationAgentSession } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session.entity"
import type { AgentSettings } from "@/domains/agents/settings/agent-settings.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentSettingsService } from "@/domains/agents/settings/agent-settings.service"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { UserGuard } from "@/domains/users/user.guard"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { StreamingService } from "./streaming.service"
import type { AgentSessionScope } from "./streaming-session.types"

@UseGuards(JwtAuthGuard, UserGuard, ResourceContextGuard)
@RequireContext("organization", "project", "agent", "agentSession")
@Controller()
export class StreamingController {
  constructor(
    private readonly chatStreamingService: StreamingService,
    private readonly agentSettingsService: AgentSettingsService,
  ) {}

  @CheckPolicy((policy) => policy.canList())
  @Sse(AgentSessionMessagesRoutes.stream.path, { method: 0 /* GET */ })
  stream(
    @Req() request: EndpointRequestWithAgentSession<ConversationAgentSession>,
    @Query("q") query: string,
  ): Observable<MessageEvent> {
    try {
      const parsedQuery = JSON.parse(query) as typeof AgentSessionMessagesRoutes.stream.request
      const userContent = parsedQuery.payload.content
      const attachmentDocumentId = parsedQuery.payload.attachmentDocumentId
      const organizationId = request.organizationId
      const projectId = request.project.id
      const agent = request.agent
      const connectScope = getRequiredConnectScope(request)

      if (!userContent) {
        throw new ForbiddenException("Missing user content")
      }

      if (typeof userContent === "string" && !userContent.trim()) {
        throw new ForbiddenException("User content must not be empty")
      }
      return new Observable<StreamEvent>((subscriber) => {
        void (async () => {
          try {
            const agentSettings = await this.resolveAgentSettings({
              connectScope: { organizationId, projectId },
              agentId: agent.id,
              session: request.agentSession,
            })
            const agentSessionScope: AgentSessionScope = {
              connectScope,
              agent,
              agentSettings,
              session: request.agentSession,
            }
            const events = this.chatStreamingService.streamAgentResponse({
              agentSessionScope,
              userContent,
              attachmentDocumentId,
              notifyClient: (event) => {
                subscriber.next(event)
              },
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

  /**
   * The settings a reply must be generated with.
   *
   * A session collected for a review campaign runs on the revision that campaign is
   * pinned to, so the whole conversation stays attributable to one configuration even
   * after newer revisions are published. Every other session (studio playground, embed,
   * sub-agent runs) keeps following the agent's latest published revision.
   */
  private async resolveAgentSettings({
    connectScope,
    agentId,
    session,
  }: {
    connectScope: RequiredConnectScope
    agentId: string
    session: ConversationAgentSession
  }): Promise<AgentSettings> {
    const pinnedAgentSettingsId = session.reviewCampaign?.agentSettingsId
    if (!pinnedAgentSettingsId) {
      return this.agentSettingsService.getLast({ connectScope, agentId })
    }

    const pinnedAgentSettings = await this.agentSettingsService.getById({
      connectScope,
      agentSettingsId: pinnedAgentSettingsId,
    })
    // Falling back to the latest revision here is exactly the mixed-configuration bug this
    // resolution exists to prevent, so a missing pin is an error rather than a default.
    if (!pinnedAgentSettings) {
      throw new NotFoundException(
        `AgentSettings with id ${pinnedAgentSettingsId} pinned by campaign ${session.campaignId} not found`,
      )
    }
    return pinnedAgentSettings
  }
}
