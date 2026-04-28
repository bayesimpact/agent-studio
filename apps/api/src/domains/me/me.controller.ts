import { MeRoutes } from "@caseai-connect/api-contracts"
import type { UserMembershipsDto } from "@caseai-connect/api-contracts/src/me/me.dto"
import { Controller, Get, Req, UseGuards } from "@nestjs/common"
import type { EndpointRequest } from "@/common/context/request.interface"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { isEmailBackofficeAuthorized } from "@/domains/backoffice/backoffice.authorization"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { OrganizationsService } from "@/domains/organizations/organizations.service"
import { UserGuard } from "@/domains/users/user.guard"
import { toDto as toOrganizationDto } from "../organizations/organization.helpers"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ProjectsService } from "../projects/projects.service"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { MeService } from "./me.service"

@UseGuards(JwtAuthGuard, UserGuard)
@Controller()
export class MeController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly meService: MeService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Get(MeRoutes.getMe.path)
  async getMe(@Req() request: EndpointRequest): Promise<typeof MeRoutes.getMe.response> {
    const user = request.user
    const organizations = await this.organizationsService.getUserOrganizations(user.id)
    const organizationsWithProjects = await Promise.all(
      organizations.map(async (org) => {
        const projects = await this.projectsService.listProjects({
          organizationId: org.id,
          userId: user.id,
        })
        return {
          ...org,
          projects,
        }
      }),
    )
    const memberships = await this.meService.getUserMemberships(user.id)
    return {
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          memberships: toUserMembershipDto(memberships),
          isBackofficeAuthorized: isEmailBackofficeAuthorized(user.email),
        },
        organizations: organizationsWithProjects.map(toOrganizationDto),
      },
    }
  }
}

function toUserMembershipDto(
  membership: Awaited<ReturnType<MeService["getUserMemberships"]>>,
): UserMembershipsDto {
  return {
    organizationMemberships: membership.organizationMemberships.map((orgMembership) => ({
      id: orgMembership.id,
      organizationId: orgMembership.organizationId,
      role: orgMembership.role,
    })),
    projectMemberships: membership.projectMemberships.map((projectMembership) => ({
      id: projectMembership.id,
      projectId: projectMembership.projectId,
      role: projectMembership.role,
    })),
    agentMemberships: membership.agentMemberships.map((agentMembership) => ({
      id: agentMembership.id,
      agentId: agentMembership.agentId,
      role: agentMembership.role,
    })),
    // Skip rows where the campaign was somehow not loaded (defensive — relation
    // is non-null in the schema). Surface campaignStatus so the UI can mirror
    // listMyCampaigns' active-only filter without an extra round-trip.
    reviewCampaignMemberships: membership.reviewCampaignMemberships
      .filter((m) => !!m.campaign)
      .map((m) => ({
        id: m.id,
        campaignId: m.campaignId,
        organizationId: m.organizationId,
        projectId: m.projectId,
        role: m.role,
        campaignStatus: m.campaign.status,
      })),
  }
}
