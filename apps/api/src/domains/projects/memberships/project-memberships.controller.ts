import { type ProjectMembershipDto, ProjectMembershipRoutes } from "@caseai-connect/api-contracts"
import { Body, Controller, Delete, Get, Post, Req, UseGuards } from "@nestjs/common"
import type {
  EndpointRequestWithProject,
  EndpointRequestWithProjectMembership,
} from "@/common/context/request.interface"
import { AddContext, RequireContext } from "@/common/context/require-context.decorator"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { TrackActivity } from "@/domains/activities/track-activity.decorator"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { UserGuard } from "@/domains/users/user.guard"
import type { ProjectMembership } from "./project-membership.entity"
import { ProjectMembershipsGuard } from "./project-memberships.guard"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ProjectMembershipsService } from "./project-memberships.service"

@UseGuards(JwtAuthGuard, UserGuard, ResourceContextGuard, ProjectMembershipsGuard)
@RequireContext("organization", "project")
@Controller()
export class ProjectMembershipsController {
  constructor(private readonly projectMembershipsService: ProjectMembershipsService) {}

  @Get(ProjectMembershipRoutes.getAll.path)
  @CheckPolicy((policy) => policy.canList())
  async getAll(
    @Req() request: EndpointRequestWithProject,
  ): Promise<typeof ProjectMembershipRoutes.getAll.response> {
    const { project } = request

    const memberships = await this.projectMembershipsService.listProjectMemberships(project.id)

    return { data: memberships.map(toDto) }
  }

  // TODO: edit role

  @Post(ProjectMembershipRoutes.createOne.path)
  @CheckPolicy((policy) => policy.canCreate())
  @TrackActivity({ action: "projectMembership.inviteMany" })
  async inviteProjectMembers(
    @Req() request: EndpointRequestWithProject,
    @Body() { payload }: typeof ProjectMembershipRoutes.createOne.request,
  ): Promise<typeof ProjectMembershipRoutes.createOne.response> {
    const { project, user } = request

    const memberships = await this.projectMembershipsService.inviteProjectMembers({
      projectId: project.id,
      emails: payload.emails,
      inviterName: user.name ?? user.email,
    })

    return { data: memberships.map(toDto) }
  }

  @Delete(ProjectMembershipRoutes.deleteOne.path)
  @CheckPolicy((policy) => policy.canDelete())
  @AddContext("projectMembership")
  @TrackActivity({ action: "projectMembership.delete", entityFrom: "memberProjectMembership" })
  async removeProjectMembership(
    @Req() request: EndpointRequestWithProjectMembership,
  ): Promise<typeof ProjectMembershipRoutes.deleteOne.response> {
    const { project, memberProjectMembership } = request

    await this.projectMembershipsService.removeProjectMembership({
      membershipId: memberProjectMembership.id,
      projectId: project.id,
      userId: request.user.id,
    })

    return { data: { success: true } }
  }
}

function toDto(entity: ProjectMembership): ProjectMembershipDto {
  return {
    id: entity.id,
    projectId: entity.projectId,
    userId: entity.userId,
    userName: entity.user.name,
    userEmail: entity.user.email,
    status: entity.status,
    createdAt: entity.createdAt.getTime(),
    role: entity.role,
  }
}
