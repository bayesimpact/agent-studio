import { ProjectsRoutes, type TimeType } from "@caseai-connect/api-contracts"
import { Body, Controller, Delete, Get, Patch, Post, Req, UseGuards } from "@nestjs/common"
import type {
  EndpointRequestWithProject,
  EndpointRequestWithUserMembership,
} from "@/common/context/request.interface"
import { AddContext, RequireContext } from "@/common/context/require-context.decorator"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { UserGuard } from "@/domains/users/user.guard"
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
    @Req() request: EndpointRequestWithUserMembership,
    @Body() body: typeof ProjectsRoutes.createOne.request,
  ): Promise<typeof ProjectsRoutes.createOne.response> {
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

  @Get(ProjectsRoutes.getAll.path)
  @CheckPolicy((policy) => policy.canList())
  async listProjects(
    @Req() request: EndpointRequestWithUserMembership,
  ): Promise<typeof ProjectsRoutes.getAll.response> {
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

  @Patch(ProjectsRoutes.updateOne.path)
  @CheckPolicy((policy) => policy.canUpdate())
  @AddContext("project")
  async updateProject(
    @Req() request: EndpointRequestWithProject,
    @Body() body: typeof ProjectsRoutes.updateOne.request,
  ): Promise<typeof ProjectsRoutes.updateOne.response> {
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

  @Delete(ProjectsRoutes.deleteOne.path)
  @CheckPolicy((policy) => policy.canDelete())
  @AddContext("project")
  async deleteProject(
    @Req() request: EndpointRequestWithProject,
  ): Promise<typeof ProjectsRoutes.deleteOne.response> {
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
