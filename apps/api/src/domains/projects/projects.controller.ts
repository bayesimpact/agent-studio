import { type ProjectDto, ProjectsRoutes, type TimeType } from "@caseai-connect/api-contracts"
import { Body, Controller, Delete, Get, Patch, Post, Req, UseGuards } from "@nestjs/common"
import type {
  EndpointRequestWithOrganizationMembership,
  EndpointRequestWithProject,
} from "@/common/context/request.interface"
import { AddContext, RequireContext } from "@/common/context/require-context.decorator"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { UserGuard } from "@/domains/users/user.guard"
import type { Project } from "./project.entity"
import { ProjectsGuard } from "./projects.guard"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ProjectsService } from "./projects.service"

@UseGuards(JwtAuthGuard, UserGuard, ResourceContextGuard, ProjectsGuard)
@RequireContext("organization")
@Controller()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post(ProjectsRoutes.createOne.path)
  @CheckPolicy((policy) => policy.canCreate())
  async createProject(
    @Req() request: EndpointRequestWithOrganizationMembership,
    @Body() body: typeof ProjectsRoutes.createOne.request,
  ): Promise<typeof ProjectsRoutes.createOne.response> {
    const { organizationId } = request

    const project = await this.projectsService.createProject(organizationId, body.payload.name)

    return { data: toProjectDto(project) }
  }

  @Get(ProjectsRoutes.getAll.path)
  @CheckPolicy((policy) => policy.canList())
  async listProjects(
    @Req() request: EndpointRequestWithOrganizationMembership,
  ): Promise<typeof ProjectsRoutes.getAll.response> {
    const { organizationId, user } = request
    const projects = await this.projectsService.listProjects({ organizationId, userId: user.id })
    return { data: projects.map(toProjectDto) }
  }

  @Patch(ProjectsRoutes.updateOne.path)
  @CheckPolicy((policy) => policy.canUpdate())
  @AddContext("project")
  async updateProject(
    @Req() request: EndpointRequestWithProject,
    @Body() body: typeof ProjectsRoutes.updateOne.request,
  ): Promise<typeof ProjectsRoutes.updateOne.response> {
    const { project } = request

    const updatedProject = await this.projectsService.updateProject(project!, body.payload.name)

    return { data: toProjectDto(updatedProject) }
  }

  @Delete(ProjectsRoutes.deleteOne.path)
  @CheckPolicy((policy) => policy.canDelete())
  @AddContext("project")
  async deleteProject(
    @Req() request: EndpointRequestWithProject,
  ): Promise<typeof ProjectsRoutes.deleteOne.response> {
    const { project } = request

    // Delete project
    await this.projectsService.deleteProject(project!)

    return { data: { success: true } }
  }
}

function toProjectDto(project: Project): ProjectDto {
  return {
    id: project.id,
    name: project.name,
    organizationId: project.organizationId,
    createdAt: project.createdAt.getTime() as TimeType,
    updatedAt: project.updatedAt.getTime() as TimeType,
  }
}
