import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { User } from "@/domains/users/user.entity"
import { Organization } from "./organization.entity"
import { type MembershipRole, UserMembership } from "./user-membership.entity"

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization) readonly organizationRepository: Repository<Organization>,
    @InjectRepository(UserMembership)
    private readonly membershipRepository: Repository<UserMembership>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async getUserOrganizationsWithMemberships(
    userId: string,
  ): Promise<Array<{ organization: Organization; role: MembershipRole }>> {
    // Use query builder to ensure proper join and handle potential null organizations
    const memberships = await this.membershipRepository
      .createQueryBuilder("membership")
      .innerJoinAndSelect("membership.organization", "organization")
      .leftJoinAndSelect("organization.featureFlags", "featureFlags")
      .where("membership.userId = :userId", { userId })
      .getMany()

    return memberships.map((membership) => ({
      organization: membership.organization,
      role: membership.role,
    }))
  }

  async createOrganization(
    userId: string,
    name: string,
  ): Promise<{ organization: Organization; role: MembershipRole }> {
    // Validate organization name (defense in depth)
    if (!name || name.trim().length < 3) {
      throw new Error("Organization name must be at least 3 characters long")
    }

    // Verify user exists and get entity reference (required for foreign key constraint)
    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new Error(`User with id ${userId} not found`)
    }

    // Create the organization
    const organization = this.organizationRepository.create({ name })
    const savedOrganization = await this.organizationRepository.save(organization)

    // Create the membership with owner role
    // Set both entity references and IDs to ensure proper foreign key handling in transactions
    const membership = this.membershipRepository.create({
      user,
      organization: savedOrganization,
      userId: user.id,
      organizationId: savedOrganization.id,
      role: "owner",
    })
    await this.membershipRepository.save(membership)

    return {
      organization: savedOrganization,
      role: "owner",
    }
  }
}
