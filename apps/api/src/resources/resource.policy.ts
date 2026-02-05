import { BasePolicy } from "@/common/policies/base-policy"
import type { Resource } from "./resource.entity"

export class ResourcePolicy extends BasePolicy<Resource> {
  canList(): boolean {
    return this.isAdminOrOwner()
  }

  canCreate(): boolean {
    return this.isAdminOrOwner()
  }

  canUpdate(): boolean {
    return this.doesResourceBelongToOrganization() && this.isAdminOrOwner()
  }

  canDelete(): boolean {
    return this.doesResourceBelongToOrganization() && this.isAdminOrOwner()
  }
}
