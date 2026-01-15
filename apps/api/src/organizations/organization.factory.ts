import { Factory } from "fishery"
import type { Organization } from "./organization.entity"

export const organizationFactory = Factory.define<Organization>(({ sequence, params }) => {
  const now = new Date()
  return {
    id: params.id || `org-${sequence}-${Date.now()}`,
    name: params.name || `Test Organization ${sequence}`,
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
    memberships: params.memberships || [],
  } as Organization
})
