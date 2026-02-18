import { Injectable, NotFoundException } from "@nestjs/common"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ProjectMembershipsService } from "@/domains/projects/memberships/project-memberships.service"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ProjectsService } from "@/domains/projects/projects.service"
import type { ContextResolver, ResolvableRequest } from "../context-resolver.interface"
import type { EndpointRequestWithProject } from "../request.interface"

@Injectable()
export class ProjectContextResolver implements ContextResolver {
  readonly resource = "project" as const

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly projectMembershipsService: ProjectMembershipsService,
  ) {}

  async resolve(request: ResolvableRequest): Promise<void> {
    const requestWithParams = request as ResolvableRequest & {
      params: { projectId?: string }
    }
    const projectId = requestWithParams.params?.projectId

    if (!projectId || projectId === ":projectId") throw new NotFoundException()

    const requestWithProject = request as EndpointRequestWithProject
    const project = await this.projectsService.getProject(
      requestWithProject.organizationId,
      projectId,
    )
    if (!project) throw new NotFoundException()

    requestWithProject.project = project
    requestWithProject.projectMembership =
      (await this.projectMembershipsService.findByProjectIdAndUserId(
        project.id,
        request.user.id,
      )) ?? undefined
  }
}
