import type { TimeType } from "@caseai-connect/api-contracts"
import { Body, Controller, Delete, Get, Patch, Post, Req, UseGuards } from "@nestjs/common"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { OrganizationGuard } from "@/domains/organizations/organization.guard"
import { UserGuard } from "@/domains/users/user.guard"
import type {
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
    const { organizationId, userMembership } = request

    // List projects for the organization
    const projects = await this.projectsService.listProjects(organizationId, {
      userId: userMembership.role === "member" ? userMembership.userId : undefined,
    })

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
  @CheckPolicy((policy) => policy.canUpdate())
  async updateProject(
    @Req() request: EndpointRequestWithProject,
    @Body() body: typeof ProjectsRoutes.updateProject.request,
  ): Promise<typeof ProjectsRoutes.updateProject.response> {
    const { project } = request

    // Update project
    const updatedProject = await this.projectsService.updateProject(project!, body.payload.name)

    return {
      data: {
        id: updatedProject.id,
        name: updatedProject.name,
        organizationId: updatedProject.organizationId,
      },
    }
  }

  @Delete(ProjectsRoutes.deleteProject.path)
  @CheckPolicy((policy) => policy.canDelete())
  async deleteProject(
    @Req() request: EndpointRequestWithProject,
  ): Promise<typeof ProjectsRoutes.deleteProject.response> {
    const { project } = request

    // Delete project
    await this.projectsService.deleteProject(project!)

    return {
      data: {
        success: true,
      },
    }
  }
}
