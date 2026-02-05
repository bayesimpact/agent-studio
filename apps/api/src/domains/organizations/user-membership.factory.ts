import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { User } from "@/domains/users/user.entity"
import type { Organization } from "./organization.entity"
import type { MembershipRole, UserMembership } from "./user-membership.entity"

type UserMembershipTransientParams = {
  user: User
  organization: Organization
}

class UserMembershipFactory extends Factory<UserMembership, UserMembershipTransientParams> {
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

export const userMembershipFactory = UserMembershipFactory.define(({ params, transientParams }) => {
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
    role: (params.role || "member") as MembershipRole,
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
    deletedAt: null,
    user: transientParams.user,
    organization: transientParams.organization,
  } satisfies UserMembership
})
