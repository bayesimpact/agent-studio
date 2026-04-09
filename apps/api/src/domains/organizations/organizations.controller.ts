import { OrganizationsRoutes } from "@caseai-connect/api-contracts"
import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common"
import type { EndpointRequest } from "@/common/context/request.interface"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ActivitiesService } from "@/domains/activities/activities.service"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { UserGuard } from "@/domains/users/user.guard"
import { toDto } from "./organization.helpers"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { OrganizationsService } from "./organizations.service"
import { OrganizationsPolicyGuard } from "./organizations-policy.guard"

@UseGuards(JwtAuthGuard, UserGuard, OrganizationsPolicyGuard)
@Controller()
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  @Post(OrganizationsRoutes.createOrganization.path)
  @CheckPolicy((policy) => policy.canCreate())
  async createOrganization(
    @Req() request: EndpointRequest,
    @Body() body: typeof OrganizationsRoutes.createOrganization.request,
  ): Promise<typeof OrganizationsRoutes.createOrganization.response> {
    const organization = await this.organizationsService.createOrganization({
      userId: request.user.id,
      name: body.payload.name,
    })
    await this.activitiesService.createActivity({
      action: "organization.create",
      userId: request.user.id,
      organizationId: organization.id,
      projectId: null,
      entityId: organization.id,
      entityType: "organization",
    })
    return { data: toDto(organization) }
  }
}
