import { Body, Controller, Headers, Post, Req, UseGuards } from "@nestjs/common"
import { normalizeAuth0Name } from "@/auth/auth0-userinfo.helper"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { Auth0UserInfoService } from "@/auth/auth0-userinfo.service"
import { JwtAuthGuard } from "@/auth/jwt-auth.guard"
import type { CreateOrganizationDto } from "./dto/create-organization.dto"
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
    private readonly auth0UserInfoService: Auth0UserInfoService,
  ) {}

  @Post(OrganizationsRoutes.createOrganization.path)
  async createOrganization(
    @Req() request: { user: Auth0JwtPayload },
    @Body() body: { payload: CreateOrganizationDto },
    @Headers("authorization") authorization?: string,
  ): Promise<typeof OrganizationsRoutes.createOrganization.response> {
    // Extract access token from Authorization header
    const accessToken = authorization?.replace(/^Bearer /i, "")

    // Try to fetch user info from Auth0 UserInfo endpoint
    let auth0UserInfo = {
      sub: request.user.sub,
      email: request.user.email,
      name: request.user.name,
      picture: request.user.picture,
    }

    if (accessToken) {
      try {
        const userInfo = await this.auth0UserInfoService.getUserInfo(accessToken)
        // Merge UserInfo endpoint data with JWT payload (UserInfo takes precedence)
        const mergedEmail = userInfo.email || request.user.email
        const mergedName = userInfo.name || request.user.name
        auth0UserInfo = {
          sub: userInfo.sub || request.user.sub,
          email: mergedEmail,
          name: normalizeAuth0Name(mergedName, mergedEmail),
          picture: userInfo.picture || request.user.picture,
        }
      } catch (_error) {
        // Fall back to JWT payload if UserInfo fetch fails
        // Normalize name even when using JWT payload
        auth0UserInfo.name = normalizeAuth0Name(auth0UserInfo.name, auth0UserInfo.email)
      }
    } else {
      // Normalize name when using JWT payload only
      auth0UserInfo.name = normalizeAuth0Name(auth0UserInfo.name, auth0UserInfo.email)
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
