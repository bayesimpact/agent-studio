import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { User } from "@/users/user.entity"
import { Organization } from "./organization.entity"
import { type MembershipRole, UserMembership } from "./user-membership.entity"

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization) readonly _organizationRepository: Repository<Organization>,
    @InjectRepository(UserMembership)
    private readonly membershipRepository: Repository<UserMembership>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
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

  async createOrganization(
    userId: string,
    name: string,
  ): Promise<{ organization: Organization; role: MembershipRole }> {
    // Verify user exists and get entity reference (required for foreign key constraint)
    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new Error(`User with id ${userId} not found`)
    }

    // Create the organization
    const organization = this._organizationRepository.create({ name })
    const savedOrganization = await this._organizationRepository.save(organization)

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
