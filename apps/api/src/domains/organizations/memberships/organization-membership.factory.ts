import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { Repository } from "typeorm"
import type { User } from "@/domains/users/user.entity"
import { userFactory } from "../../users/user.factory"
import type { Organization } from "../organization.entity"
import type {
  OrganizationMembership,
  OrganizationMembershipRole,
} from "./organization-membership.entity"

type OrganizationMembershipTransientParams = {
  user: User
  organization: Organization
}

class OrganizationMembershipFactory extends Factory<
  OrganizationMembership,
  OrganizationMembershipTransientParams
> {
  member() {
    return this.params({ role: "member" })
  }

  admin() {
    return this.params({ role: "admin" })
  }

  owner() {
    return this.params({ role: "owner" })
  }
}

export const organizationMembershipFactory = OrganizationMembershipFactory.define(
  ({ params, transientParams }) => {
    if (!transientParams.user) {
      throw new Error("user transient is required")
    }
    if (!transientParams.organization) {
      throw new Error("organization transient is required")
    }

    const now = new Date()
    return {
      id: params.id || randomUUID(),
      userId: transientParams.user.id,
      organizationId: transientParams.organization.id,
      role: (params.role || "member") as OrganizationMembershipRole,
      createdAt: params.createdAt || now,
      updatedAt: params.updatedAt || now,
      deletedAt: params.deletedAt || null,
      user: transientParams.user,
      organization: transientParams.organization,
    } satisfies OrganizationMembership
  },
)

export const createOrganizationMembership = async ({
  repositories,
  organization,
  membership,
  user,
}: {
  repositories: {
    userRepository: Repository<User>
    organizationRepository: Repository<Organization>
    membershipRepository: Repository<OrganizationMembership>
  }
  organization: Organization
  user?: Partial<User>
  membership?: Partial<OrganizationMembership>
}) => {
  const newUser = userFactory.build(user)
  await repositories.userRepository.save(newUser)
  const newMembership = await repositories.membershipRepository.save(
    organizationMembershipFactory.transient({ user: newUser, organization }).build(membership),
  )
  return { user: newUser, membership: newMembership }
}
