import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { Organization } from "./organization.entity"
import { type MembershipRole, UserMembership } from "./user-membership.entity"

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization) readonly _organizationRepository: Repository<Organization>,
    @InjectRepository(UserMembership)
    private readonly membershipRepository: Repository<UserMembership>,
  ) {}

  async getUserOrganizationsWithMemberships(
    userId: string,
  ): Promise<Array<{ organization: Organization; role: MembershipRole }>> {
    const memberships = await this.membershipRepository.find({
      where: { userId },
      relations: ["organization"],
    })

    return memberships.map((membership) => ({
      organization: membership.organization,
      role: membership.role,
    }))
  }
}
