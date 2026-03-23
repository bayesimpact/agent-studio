import { InvitationsRoutes } from "@caseai-connect/api-contracts"
import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common"
import type { JwtPayload } from "@/common/context/request.interface"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ProjectMembershipsService } from "@/domains/projects/memberships/project-memberships.service"

/**
 * Handles invitation acceptance.
 *
 * Only guarded by JwtAuthGuard (no UserGuard) because this endpoint must run
 * BEFORE /me to reconcile the placeholder user's auth0Id with the real one.
 * If UserGuard ran first, it would call findOrCreate and create a duplicate user.
 */
@UseGuards(JwtAuthGuard)
@Controller()
export class ProjectInvitationsController {
  constructor(private readonly projectMembershipsService: ProjectMembershipsService) {}

  @Post(InvitationsRoutes.acceptProjectOne.path)
  async acceptInvitation(
    @Req() request: { user: JwtPayload },
    @Body() body: typeof InvitationsRoutes.acceptProjectOne.request,
  ): Promise<typeof InvitationsRoutes.acceptProjectOne.response> {
    // request.user is the raw JWT payload (set by JwtAuthGuard), not a User entity
    const jwtPayload = request.user

    await this.projectMembershipsService.acceptInvitation({
      ticketId: body.payload.ticketId,
      auth0Sub: jwtPayload.sub,
    })

    return { data: { success: true } }
  }
}
