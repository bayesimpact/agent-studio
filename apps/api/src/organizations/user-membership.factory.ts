import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { MembershipRole, UserMembership } from "./user-membership.entity"

export const userMembershipFactory = Factory.define<UserMembership>(({ params }) => {
  const now = new Date()
  return {
    id: params.id || randomUUID(),
    userId: params.userId || randomUUID(),
    organizationId: params.organizationId || randomUUID(),
    role: (params.role || "member") as MembershipRole,
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
    user: params.user || ({} as UserMembership["user"]),
    organization: params.organization || ({} as UserMembership["organization"]),
  } as UserMembership
})
