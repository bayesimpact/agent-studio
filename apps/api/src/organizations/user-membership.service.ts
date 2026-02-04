import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { UserMembership } from "./user-membership.entity"

@Injectable()
export class UserMembershipService {
  constructor(
    @InjectRepository(UserMembership)
    private readonly membershipRepository: Repository<UserMembership>,
  ) {}

  /**
   * Finds a user membership for a given user and organization.
   * @param params - Object containing userId and organizationId
   * @param params.userId - The ID of the user
   * @param params.organizationId - The ID of the organization
   * @returns The UserMembership if found, null otherwise
   */
  async findUserMembership({
    userId,
    organizationId,
  }: {
    userId: string
    organizationId: string
  }): Promise<UserMembership | null> {
    return this.membershipRepository.findOne({ where: { userId, organizationId } })
  }
}
