import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common"
import type { CreateProjectRequestDto } from "@repo/api"
import { JwtAuthGuard } from "@/auth/jwt-auth.guard"
import type { TimeType } from "@/exports/dtos/generic"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { UserBootstrapService } from "@/organizations/user-bootstrap.service"
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
    // Extract Auth0 user info from JWT payload
    const auth0UserInfo = {
      sub: request.user.sub,
      email: request.user.email,
      name: request.user.name,
      picture: request.user.picture,
    }

    // Ensure user exists locally
    const user = await this.userBootstrapService.ensureUser(auth0UserInfo)

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
    // Extract Auth0 user info from JWT payload
    const auth0UserInfo = {
      sub: request.user.sub,
      email: request.user.email,
      name: request.user.name,
      picture: request.user.picture,
    }

    // Ensure user exists locally
    const user = await this.userBootstrapService.ensureUser(auth0UserInfo)

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
}
