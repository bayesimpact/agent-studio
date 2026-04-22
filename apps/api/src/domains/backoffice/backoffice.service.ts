import type { FeatureFlagKey } from "@caseai-connect/api-contracts"
import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { FeatureFlag } from "../feature-flags/feature-flag.entity"
import { Organization } from "../organizations/organization.entity"
import { Project } from "../projects/project.entity"
import { User } from "../users/user.entity"

@Injectable()
export class BackofficeService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(Project) private readonly projectRepository: Repository<Project>,
    @InjectRepository(FeatureFlag)
    private readonly featureFlagRepository: Repository<FeatureFlag>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async listOrganizationsWithProjects(): Promise<Organization[]> {
    return this.organizationRepository.find({
      relations: { projects: { featureFlags: true } },
      order: { createdAt: "DESC" },
    })
  }

  async listUsersWithMemberships(): Promise<User[]> {
    return this.userRepository.find({
      relations: {
        memberships: { organization: true },
        projectMemberships: { project: true },
        agentMemberships: { agent: true },
      },
      order: { createdAt: "DESC" },
    })
  }

  async addFeatureFlag({
    projectId,
    featureFlagKey,
  }: {
    projectId: string
    featureFlagKey: FeatureFlagKey
  }): Promise<void> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } })
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`)
    }
    const existing = await this.featureFlagRepository.findOne({
      where: { projectId, featureFlagKey },
    })
    if (existing) {
      if (!existing.enabled) {
        existing.enabled = true
        await this.featureFlagRepository.save(existing)
      }
      return
    }
    const flag = this.featureFlagRepository.create({
      projectId,
      featureFlagKey,
      enabled: true,
    })
    await this.featureFlagRepository.save(flag)
  }

  async removeFeatureFlag({
    projectId,
    featureFlagKey,
  }: {
    projectId: string
    featureFlagKey: FeatureFlagKey
  }): Promise<void> {
    await this.featureFlagRepository.delete({ projectId, featureFlagKey })
  }
}
