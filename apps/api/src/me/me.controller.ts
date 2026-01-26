import { Controller, Get, Headers, NotFoundException, Req, UseGuards } from "@nestjs/common"
import { normalizeAuth0Name } from "@/auth/auth0-userinfo.helper"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { Auth0UserInfoService } from "@/auth/auth0-userinfo.service"
import { JwtAuthGuard } from "@/auth/jwt-auth.guard"
import { getAccessToken } from "@/common/utils/get-access-token"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { OrganizationsService } from "@/organizations/organizations.service"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { UserBootstrapService } from "@/organizations/user-bootstrap.service"
import type { EndpointRequest } from "@/request.interface"
import { MeRoutes } from "./me.routes"

@UseGuards(JwtAuthGuard)
@Controller()
export class MeController {
  constructor(
    private readonly userBootstrapService: UserBootstrapService,
    private readonly organizationsService: OrganizationsService,
    private readonly auth0UserInfoService: Auth0UserInfoService,
  ) {}

  @Get(MeRoutes.getMe.path)
  async getMe(
    @Req() request: EndpointRequest,
    @Headers("authorization") authorization?: string,
  ): Promise<typeof MeRoutes.getMe.response> {
    const accessToken = getAccessToken(authorization)

    try {
      const userInfo = await this.auth0UserInfoService.getUserInfo(accessToken)
      const auth0UserInfo = {
        sub: userInfo.sub || request.user.sub,
        email: userInfo.email,
        name: normalizeAuth0Name(userInfo.name, userInfo.email),
        picture: userInfo.picture,
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
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          organizations,
        },
      }
    } catch (error) {
      throw new NotFoundException("User not found", { cause: error as Error })
    }
  }
}
