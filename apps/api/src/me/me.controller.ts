import { Controller, Get, Req, UseGuards } from "@nestjs/common"
import type { MeResponseDto } from "@repo/api"
import { JwtAuthGuard } from "@/auth/jwt-auth.guard"
import type { OrganizationsService } from "@/organizations/organizations.service"
import type { UserBootstrapService } from "@/organizations/user-bootstrap.service"

interface Auth0JwtPayload {
  sub: string
  email?: string
  name?: string
  picture?: string
}

@UseGuards(JwtAuthGuard)
@Controller("me")
export class MeController {
  constructor(
    private readonly userBootstrapService: UserBootstrapService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  @Get()
  async getMe(@Req() request: { user: Auth0JwtPayload }): Promise<MeResponseDto> {
    // Extract Auth0 user info from JWT payload
    const auth0UserInfo = {
      sub: request.user.sub,
      email: request.user.email,
      name: request.user.name,
      picture: request.user.picture,
    }

    // Ensure user exists locally
    const user = await this.userBootstrapService.ensureUser(auth0UserInfo)

    // Load user's organizations with memberships
    const organizationsWithMemberships =
      await this.organizationsService.getUserOrganizationsWithMemberships(user.id)

    // Format response
    const organizations = organizationsWithMemberships.map(({ organization, role }) => ({
      id: organization.id,
      name: organization.name,
      role,
    }))

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      organizations,
    }
  }
}
