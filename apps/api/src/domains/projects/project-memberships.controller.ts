import type { ProjectMembershipDto } from "@caseai-connect/api-contracts"
import { Body, Controller, Delete, Get, Post, Req, UseGuards } from "@nestjs/common"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { OrganizationGuard } from "@/domains/organizations/organization.guard"
import { UserGuard } from "@/domains/users/user.guard"
import type {
  EndpointRequestWithProject,
  EndpointRequestWithProjectMembership,
} from "@/request.interface"
import type { ProjectMembership } from "./project-membership.entity"
import { ProjectMembershipsGuard } from "./project-memberships.guard"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ProjectMembershipsService } from "./project-memberships.service"
import { ProjectsGuard } from "./projects.guard"
import { ProjectsRoutes } from "./projects.routes"

@UseGuards(JwtAuthGuard, UserGuard, OrganizationGuard, ProjectsGuard, ProjectMembershipsGuard)
@Controller()
export class ProjectMembershipsController {
  constructor(private readonly projectMembershipsService: ProjectMembershipsService) {}

  @Get(ProjectsRoutes.listProjectMemberships.path)
  @CheckPolicy((policy) => policy.canList())
  async listProjectMemberships(
    @Req() request: EndpointRequestWithProject,
  ): Promise<typeof ProjectsRoutes.listProjectMemberships.response> {
    const { project } = request

    const memberships = await this.projectMembershipsService.listProjectMemberships(project.id)

    return {
      data: {
        memberships: memberships.map(toProjectMembershipDto),
      },
    }
  }

  @Post(ProjectsRoutes.inviteProjectMembers.path)
  @CheckPolicy((policy) => policy.canCreate())
  async inviteProjectMembers(
    @Req() request: EndpointRequestWithProject,
    @Body() body: typeof ProjectsRoutes.inviteProjectMembers.request,
  ): Promise<typeof ProjectsRoutes.inviteProjectMembers.response> {
    const { project } = request

    const memberships = await this.projectMembershipsService.inviteProjectMembers(
      project.id,
      body.payload.emails,
    )

    return {
      data: {
        memberships: memberships.map(toProjectMembershipDto),
      },
    }
  }

  @Delete(ProjectsRoutes.removeProjectMembership.path)
  @CheckPolicy((policy) => policy.canDelete())
  async removeProjectMembership(
    @Req() request: EndpointRequestWithProjectMembership,
  ): Promise<typeof ProjectsRoutes.removeProjectMembership.response> {
    const { project, projectMembership } = request

    await this.projectMembershipsService.removeProjectMembership(projectMembership.id, project.id)

    return {
      data: {
        success: true,
      },
    }
  }
}

function toProjectMembershipDto(entity: ProjectMembership): ProjectMembershipDto {
  return {
    id: entity.id,
    projectId: entity.projectId,
    userId: entity.userId,
    userName: entity.user.name,
    userEmail: entity.user.email,
    status: entity.status,
    createdAt: entity.createdAt.getTime(),
  }
}
