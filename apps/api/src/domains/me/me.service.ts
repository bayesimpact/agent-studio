import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { AgentMembership } from "@/domains/agents/memberships/agent-membership.entity"
import { OrganizationMembership } from "@/domains/organizations/memberships/organization-membership.entity"
import { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"

@Injectable()
export class MeService {
  constructor(
    @InjectRepository(OrganizationMembership)
    private readonly organizationMembershipRepository: Repository<OrganizationMembership>,
    @InjectRepository(ProjectMembership)
    private readonly projectMembershipRepository: Repository<ProjectMembership>,
    @InjectRepository(AgentMembership)
    private readonly agentMembershipRepository: Repository<AgentMembership>,
  ) {}

  async getUserMemberships(userId: string): Promise<{
    organizationMemberships: OrganizationMembership[]
    projectMemberships: ProjectMembership[]
    agentMemberships: AgentMembership[]
  }> {
    const [organizationMemberships, projectMemberships, agentMemberships] = await Promise.all([
      this.organizationMembershipRepository.find({
        where: { userId },
        relations: ["organization"],
      }),
      this.projectMembershipRepository.find({
        where: { userId },
        relations: ["project"],
      }),
      this.agentMembershipRepository.find({
        where: { userId },
        relations: ["agent"],
      }),
    ])

    return { organizationMemberships, projectMemberships, agentMemberships }
  }
}
