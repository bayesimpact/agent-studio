import { InvitationsRoutes } from "@caseai-connect/api-contracts"
import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common"
import type { JwtPayload } from "@/common/context/request.interface"
import { getAccessToken } from "@/common/utils/get-access-token"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { InvitationsService } from "./invitations.service"

/**
 * Handles invitation acceptance.
 *
 * Only guarded by JwtAuthGuard (no UserGuard) because this endpoint must run
 * BEFORE /me to reconcile the placeholder user's auth0Id with the real one.
 */
@UseGuards(JwtAuthGuard)
@Controller()
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post(InvitationsRoutes.acceptOne.path)
  async acceptInvitation(
    @Req() request: { user: JwtPayload },
    @Body() body: typeof InvitationsRoutes.acceptOne.request,
  ): Promise<typeof InvitationsRoutes.acceptOne.response> {
    const jwtPayload = request.user
    // @ts-expect-error
    const accessToken = getAccessToken(request.headers.authorization)

    await this.invitationsService.acceptInvitation({
      ticketId: body.payload.ticketId,
      auth0Sub: jwtPayload.sub,
      accessToken,
    })

    return { data: { success: true } }
  }
}
