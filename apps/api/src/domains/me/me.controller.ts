import { MeRoutes } from "@caseai-connect/api-contracts"
import { Controller, Get, Req, UseGuards } from "@nestjs/common"
import type { EndpointRequest } from "@/common/context/request.interface"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { OrganizationsService } from "@/domains/organizations/organizations.service"
import { UserGuard } from "@/domains/users/user.guard"
import { toDto as toOrganizationDto } from "../organizations/organization.helpers"

@UseGuards(JwtAuthGuard, UserGuard)
@Controller()
export class MeController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get(MeRoutes.getMe.path)
  async getMe(@Req() request: EndpointRequest): Promise<typeof MeRoutes.getMe.response> {
    const user = request.user

    // Load user's organizations with memberships
    const organizationsWithMemberships =
      await this.organizationsService.getUserOrganizationsWithMemberships(user.id)

    // Format response
    const organizations = organizationsWithMemberships.map(toOrganizationDto)

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
  }
}
