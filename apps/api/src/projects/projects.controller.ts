import type { TimeType } from "@caseai-connect/api-contracts"
import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "@/auth/jwt-auth.guard"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { UserGuard } from "@/guards/user.guard"
import { OrganizationGuard } from "@/organizations/organization.guard"
import type {
  EndpointRequest,
  EndpointRequestWithProject,
  EndpointRequestWithUserMembership,
} from "@/request.interface"
import { ProjectsGuard } from "./projects.guard"
import { ProjectsRoutes } from "./projects.routes"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ProjectsService } from "./projects.service"

@UseGuards(JwtAuthGuard, UserGuard, OrganizationGuard, ProjectsGuard)
@Controller()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post(ProjectsRoutes.createProject.path)
  @CheckPolicy((policy) => policy.canCreate())
  async createProject(
    @Req() request: EndpointRequestWithUserMembership,
    @Body() body: typeof ProjectsRoutes.createProject.request,
  ): Promise<typeof ProjectsRoutes.createProject.response> {
    const { organizationId } = request

    // Create project
    const project = await this.projectsService.createProject(organizationId, body.payload.name)

    return {
      data: {
        id: project.id,
        name: project.name,
        organizationId: project.organizationId,
      },
    }
  }

  @Get(ProjectsRoutes.listProjects.path)
  @CheckPolicy((policy) => policy.canList())
  async listProjects(
    @Req() request: EndpointRequestWithUserMembership,
  ): Promise<typeof ProjectsRoutes.listProjects.response> {
    const { organizationId } = request

    // List projects for the organization
    const projects = await this.projectsService.listProjects(organizationId)

    return {
      data: {
        projects: projects.map((project) => ({
          id: project.id,
          name: project.name,
          organizationId: project.organizationId,
          createdAt: project.createdAt.getTime() as TimeType,
          updatedAt: project.updatedAt.getTime() as TimeType,
        })),
      },
    }
  }

  @Patch(ProjectsRoutes.updateProject.path)
  async updateProject(
    @Req() request: EndpointRequest,
    @Param("projectId") projectId: string,
    @Body() body: typeof ProjectsRoutes.updateProject.request,
  ): Promise<typeof ProjectsRoutes.updateProject.response> {
    const user = request.user

    // Update project
    const project = await this.projectsService.updateProject(user.id, projectId, body.payload.name)

    return {
      data: {
        id: project.id,
        name: project.name,
        organizationId: project.organizationId,
      },
    }
  }

  @Delete(ProjectsRoutes.deleteProject.path)
  @CheckPolicy((policy) => policy.canDelete())
  async deleteProject(
    @Req() request: EndpointRequestWithProject,
  ): Promise<typeof ProjectsRoutes.deleteProject.response> {
    const { user, project } = request

    // Delete project
    await this.projectsService.deleteProject(user.id, project!.id)

    return {
      data: {
        success: true,
      },
    }
  }
}
