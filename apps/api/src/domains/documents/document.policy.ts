import { ProjectScopedPolicy } from "@/common/policies/project-scoped-policy"
import type { Document } from "./document.entity"

export class DocumentPolicy extends ProjectScopedPolicy<Document> {
  canList(): boolean {
    return this.isAdminOrOwner()
  }

  canCreate(): boolean {
    return this.isAdminOrOwner()
  }

  canUpdate(): boolean {
    return this.isAdminOrOwner()
  }

  canDelete(): boolean {
    return this.isAdminOrOwner()
  }
}
