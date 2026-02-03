import type { TimeType } from "@caseai-connect/api-contracts"
import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "@/auth/jwt-auth.guard"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { UserGuard } from "@/guards/user.guard"
import { OrganizationGuard } from "@/organizations/organization.guard"
import type { EndpointRequest, EndpointRequestWithUserMembership } from "@/request.interface"
import { ProjectsGuard } from "./projects.guard"
import { ProjectsRoutes } from "./projects.routes"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ProjectsService } from "./projects.service"

@UseGuards(JwtAuthGuard, UserGuard, OrganizationGuard, ProjectsGuard)
@Controller()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post(ProjectsRoutes.createProject.path)
  async createProject(
    @Req() request: EndpointRequest,
    @Body() body: typeof ProjectsRoutes.createProject.request,
  ): Promise<typeof ProjectsRoutes.createProject.response> {
    const user = request.user

    // Create project
    const project = await this.projectsService.createProject(
      user.id,
      body.payload.organizationId,
      body.payload.name,
    )

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
    const { user, organizationId } = request

    // List projects for the organization
    const projects = await this.projectsService.listProjects(user.id, organizationId)

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
  async deleteProject(
    @Req() request: EndpointRequest,
    @Param("projectId") projectId: string,
  ): Promise<typeof ProjectsRoutes.deleteProject.response> {
    const user = request.user

    // Delete project
    await this.projectsService.deleteProject(user.id, projectId)

    return {
      data: {
        success: true,
      },
    }
  }
}
