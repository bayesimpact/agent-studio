import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { UserGuard } from "@/guards/user.guard"
import type { EndpointRequest } from "@/request.interface"
import { OrganizationsRoutes } from "./organizations.routes"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { OrganizationsService } from "./organizations.service"

@UseGuards(JwtAuthGuard, UserGuard)
@Controller()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post(OrganizationsRoutes.createOrganization.path)
  async createOrganization(
    @Req() request: EndpointRequest,
    @Body() body: typeof OrganizationsRoutes.createOrganization.request,
  ): Promise<typeof OrganizationsRoutes.createOrganization.response> {
    const user = request.user

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
