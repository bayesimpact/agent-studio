import type { OrganizationMembership } from "@/domains/organizations/memberships/organization-membership.entity"

export class BasePolicy<T> {
  constructor(
    private readonly organizationMembership: OrganizationMembership,
    protected readonly entity?: T,
  ) {
    this.organizationMembership = organizationMembership
    this.entity = entity
  }

  canList(): boolean {
    return false
  }

  canCreate(): boolean {
    return false
  }

  canUpdate(): boolean {
    return false
  }

  canDelete(): boolean {
    return false
  }

  protected isOwner(): boolean {
    return this.organizationMembership.role === "owner"
  }

  protected isAdmin(): boolean {
    return this.organizationMembership.role === "admin"
  }

  protected isAdminOrOwner(): boolean {
    return this.isAdmin() || this.isOwner()
  }

  // TODO: once we have a better way to type the resource which has an organizationId property, we can remove this method
  protected doesResourceBelongToOrganization(): boolean {
    if (!this.entity) return false

    // Ensure resource is an object (not a primitive) before using 'in' operator
    if (typeof this.entity !== "object") {
      return false
    }

    // Check if resource has organizationId property using 'in' operator
    if (!("organizationId" in this.entity)) {
      return false
    }
    // TypeScript now knows organizationId exists, but we need to assert the type
    const resourceWithOrgId = this.entity as T & { organizationId: string }
    return resourceWithOrgId.organizationId === this.organizationMembership.organizationId
  }
}
