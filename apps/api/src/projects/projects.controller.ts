import type {
  CreateProjectRequestDto,
  TimeType,
  UpdateProjectRequestDto,
} from "@caseai-connect/api-contracts"
import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "@/auth/jwt-auth.guard"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { UserBootstrapService } from "@/organizations/user-bootstrap.service"
import type { User } from "@/users/user.entity"
import { ProjectsRoutes } from "./projects.routes"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ProjectsService } from "./projects.service"

interface Auth0JwtPayload {
  sub: string
  email?: string
  name?: string
  picture?: string
}

@UseGuards(JwtAuthGuard)
@Controller()
export class ProjectsController {
  constructor(
    private readonly userBootstrapService: UserBootstrapService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Post(ProjectsRoutes.createProject.path)
  async createProject(
    @Req() request: { user: Auth0JwtPayload },
    @Body() body: { payload: CreateProjectRequestDto },
  ): Promise<typeof ProjectsRoutes.createProject.response> {
    const user = await this.ensureUserFromRequest(request)

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
  async listProjects(
    @Req() request: { user: Auth0JwtPayload },
    @Param("organizationId") organizationId: string,
  ): Promise<typeof ProjectsRoutes.listProjects.response> {
    const user = await this.ensureUserFromRequest(request)

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
    @Req() request: { user: Auth0JwtPayload },
    @Param("projectId") projectId: string,
    @Body() body: { payload: UpdateProjectRequestDto },
  ): Promise<typeof ProjectsRoutes.updateProject.response> {
    const user = await this.ensureUserFromRequest(request)

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
    @Req() request: { user: Auth0JwtPayload },
    @Param("projectId") projectId: string,
  ): Promise<typeof ProjectsRoutes.deleteProject.response> {
    const user = await this.ensureUserFromRequest(request)

    // Delete project
    await this.projectsService.deleteProject(user.id, projectId)

    return {
      data: {
        success: true,
      },
    }
  }

  /**
   * Extracts Auth0 user info from JWT payload and ensures the user exists locally.
   * Returns the local User entity.
   */
  private async ensureUserFromRequest(request: { user: Auth0JwtPayload }): Promise<User> {
    const auth0UserInfo = {
      sub: request.user.sub,
      email: request.user.email,
      name: request.user.name,
      picture: request.user.picture,
    }

    return this.userBootstrapService.ensureUser(auth0UserInfo)
  }
}
