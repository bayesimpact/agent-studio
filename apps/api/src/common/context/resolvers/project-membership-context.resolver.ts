import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import type { ContextResolver, ResolvableRequest } from "../context-resolver.interface"
import type { EndpointRequestWithProjectMembership } from "../request.interface"

@Injectable()
export class ProjectMembershipContextResolver implements ContextResolver {
  readonly resource = "projectMembership" as const

  constructor(
    @InjectRepository(ProjectMembership)
    private readonly projectMembershipRepository: Repository<ProjectMembership>,
  ) {}

  async resolve(request: ResolvableRequest): Promise<void> {
    const requestWithParams = request as ResolvableRequest & {
      params: { membershipId?: string }
    }
    const membershipId = requestWithParams.params?.membershipId

    if (!membershipId || membershipId === ":membershipId") throw new NotFoundException()

    const requestWithProject = request as EndpointRequestWithProjectMembership
    const projectMembership =
      (await this.projectMembershipRepository.findOne({
        where: {
          id: membershipId,
          projectId: requestWithProject.project.id,
        },
      })) ?? undefined
    if (!projectMembership) throw new NotFoundException()

    requestWithProject.projectMembership = projectMembership
  }
}
