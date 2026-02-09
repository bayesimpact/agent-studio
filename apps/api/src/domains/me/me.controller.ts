import { Controller, Get, NotFoundException, Req, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { OrganizationsService } from "@/domains/organizations/organizations.service"
import { UserGuard } from "@/domains/users/user.guard"
import type { EndpointRequest } from "@/request.interface"
import { MeRoutes } from "./me.routes"

@UseGuards(JwtAuthGuard, UserGuard)
@Controller()
export class MeController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get(MeRoutes.getMe.path)
  async getMe(@Req() request: EndpointRequest): Promise<typeof MeRoutes.getMe.response> {
    const user = request.user
    try {
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
