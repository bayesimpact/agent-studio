import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common"
import type { CreateOrganizationRequestDto } from "@repo/api"
import { JwtAuthGuard } from "@/auth/jwt-auth.guard"
import { OrganizationsRoutes } from "./organizations.routes"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { OrganizationsService } from "./organizations.service"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { UserBootstrapService } from "./user-bootstrap.service"

interface Auth0JwtPayload {
  sub: string
  email?: string
  name?: string
  picture?: string
}

@UseGuards(JwtAuthGuard)
@Controller()
export class OrganizationsController {
  constructor(
    private readonly userBootstrapService: UserBootstrapService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  @Post(OrganizationsRoutes.createOrganization.path)
  async createOrganization(
    @Req() request: { user: Auth0JwtPayload },
    @Body() body: { payload: CreateOrganizationRequestDto },
  ): Promise<typeof OrganizationsRoutes.createOrganization.response> {
    // Extract Auth0 user info from JWT payload
    const auth0UserInfo = {
      sub: request.user.sub,
      email: request.user.email,
      name: request.user.name,
      picture: request.user.picture,
    }

    // Ensure user exists locally
    const user = await this.userBootstrapService.ensureUser(auth0UserInfo)

    // Create organization with the user as owner
    const { organization, role } = await this.organizationsService.createOrganization(
      user.id,
      body.payload.name,
    )

    return {
      data: {
        id: organization.id,
        name: organization.name,
        role,
      },
    }
  }
}
