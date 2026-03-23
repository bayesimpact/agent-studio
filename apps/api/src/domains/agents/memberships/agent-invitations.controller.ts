import { InvitationsRoutes } from "@caseai-connect/api-contracts"
import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common"
import type { JwtPayload } from "@/common/context/request.interface"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentMembershipsService } from "./agent-memberships.service"

/**
 * Handles agent invitation acceptance.
 *
 * Only guarded by JwtAuthGuard (no UserGuard) because this endpoint must run
 * BEFORE /me to reconcile the placeholder user's auth0Id with the real one.
 */
@UseGuards(JwtAuthGuard)
@Controller()
export class AgentInvitationsController {
  constructor(private readonly agentMembershipsService: AgentMembershipsService) {}

  @Post(InvitationsRoutes.acceptAgentOne.path)
  async acceptInvitation(
    @Req() request: { user: JwtPayload },
    @Body() body: typeof InvitationsRoutes.acceptAgentOne.request,
  ): Promise<typeof InvitationsRoutes.acceptAgentOne.response> {
    const jwtPayload = request.user

    await this.agentMembershipsService.acceptInvitation({
      ticketId: body.payload.ticketId,
      auth0Sub: jwtPayload.sub,
    })

    return { data: { success: true } }
  }
}
