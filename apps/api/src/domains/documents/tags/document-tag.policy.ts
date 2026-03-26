import { ProjectScopedPolicy } from "@/common/policies/project-scoped-policy"
import type { DocumentTag } from "./document-tag.entity"

export class DocumentTagPolicy extends ProjectScopedPolicy<DocumentTag> {
  canList(): boolean {
    return this.canAccess() && this.isProjectAdminOrOwner()
  }

  canCreate(): boolean {
    return this.canList()
  }

  canUpdate(): boolean {
    return this.canAccess() && this.isProjectAdminOrOwner() && this.doesResourceBelongToScope()
  }

  canDelete(): boolean {
    return this.canUpdate()
  }
}
