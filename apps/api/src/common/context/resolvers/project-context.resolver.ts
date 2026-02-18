import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import { Project } from "@/domains/projects/project.entity"
import type { ContextResolver, ResolvableRequest } from "../context-resolver.interface"
import type { EndpointRequestWithProject } from "../request.interface"

@Injectable()
export class ProjectContextResolver implements ContextResolver {
  readonly resource = "project" as const

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMembership)
    private readonly projectMembershipRepository: Repository<ProjectMembership>,
  ) {}

  async resolve(request: ResolvableRequest): Promise<void> {
    const requestWithParams = request as ResolvableRequest & {
      params: { projectId?: string }
    }
    const projectId = requestWithParams.params?.projectId

    if (!projectId || projectId === ":projectId") throw new NotFoundException()

    const requestWithProject = request as EndpointRequestWithProject
    const project =
      (await this.projectRepository.findOne({
        where: {
          id: projectId,
          organizationId: requestWithProject.organizationId,
        },
      })) ?? undefined
    if (!project) throw new NotFoundException()

    requestWithProject.project = project
    requestWithProject.projectMembership =
      (await this.projectMembershipRepository.findOne({
        where: {
          projectId: project.id,
          userId: request.user.id,
        },
      })) ?? undefined
  }
}
