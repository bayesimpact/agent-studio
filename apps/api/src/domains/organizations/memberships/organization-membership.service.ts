import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { OrganizationMembership } from "./organization-membership.entity"

@Injectable()
export class OrganizationMembershipService {
  constructor(
    @InjectRepository(OrganizationMembership)
    private readonly repo: Repository<OrganizationMembership>,
  ) {}

  /**
   * Finds a user membership for a given user and organization.
   * @param params - Object containing userId and organizationId
   * @param params.userId - The ID of the user
   * @param params.organizationId - The ID of the organization
   * @returns The OrganizationMembership if found, null otherwise
   */
  async findOrganizationMembership({
    userId,
    organizationId,
  }: {
    userId: string
    organizationId: string
  }): Promise<OrganizationMembership | null> {
    return this.repo.findOne({ where: { userId, organizationId } })
  }
}
