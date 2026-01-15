import { Factory } from "fishery"
import type { MembershipRole, UserMembership } from "./user-membership.entity"

export const userMembershipFactory = Factory.define<UserMembership>(({ sequence, params }) => {
  const now = new Date()
  return {
    id: params.id || `membership-${sequence}-${Date.now()}`,
    userId: params.userId || `user-${sequence}`,
    organizationId: params.organizationId || `org-${sequence}`,
    role: (params.role || "member") as MembershipRole,
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
    user: params.user || ({} as UserMembership["user"]),
    organization: params.organization || ({} as UserMembership["organization"]),
  } as UserMembership
})
